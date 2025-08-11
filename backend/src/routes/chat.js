const express = require('express');
const { body, validationResult } = require('express-validator');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Swap = require('../models/Swap');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();
let io;

const setIO = (socketIO) => {
  io = socketIO;
};

// File upload storage (local for now). In production, replace with S3/GCS.
const fs = require('fs');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const upload = multer({ storage });

// @route   POST /api/chat/conversations/:id/files
// @desc    Upload a file and create a file message
// @access  Private
router.post('/conversations/:id/files', auth, upload.single('file'), async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(p => {
      const participantId = (p.user && p.user._id) ? p.user._id.toString() : p.user.toString();
      return participantId === req.user._id.toString() && p.isActive;
    });
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to send files in this conversation' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const message = await Message.createFileMessage(
      req.params.id,
      req.user._id,
      req.file.originalname,
      req.file.size,
      req.file.mimetype,
      fileUrl
    );

    await message.populate('sender', 'username firstName lastName profilePicture');

    // Emit socket event to all participants (including sender)
    if (io) {
      const participantIds = conversation.participants
        .filter(p => p.isActive)
        .map(p => (p.user && p.user._id) ? p.user._id.toString() : p.user.toString());
      
      console.log('Emitting file message to participants:', participantIds);
      participantIds.forEach((participantId) => {
        console.log(`Emitting file to user_${participantId}`);
        io.to(`user_${participantId}`).emit('message_received', {
          conversationId: req.params.id,
          message: message,
          participants: participantIds
        });
      });
    } else {
      console.log('Socket.io not available for file message emission');
    }

    res.status(201).json({ message: message });
  } catch (error) {
    console.error('File upload message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// @route   GET /api/chat/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type || '';

    const query = {
      'participants.user': req.user._id,
      'participants.isActive': true,
      isActive: true
    };

    if (type) query.type = type;

    const conversations = await Conversation.find(query)
      .populate('participants.user', 'username firstName lastName profilePicture')
      .populate('lastMessage.sender', 'username firstName lastName profilePicture')
      .populate('swapId', 'title')
      .sort({ 'lastMessage.timestamp': -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Conversation.countDocuments(query);

    res.json({
      conversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/chat/conversations/:id
// @desc    Get specific conversation
// @access  Private
router.get('/conversations/:id', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants.user', 'username firstName lastName profilePicture bio')
      .populate('swapId', 'title description scheduledDate')
      .populate('pinnedMessages.messageId', 'content sender createdAt');

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(p => 
      p.user._id.toString() === req.user._id.toString() && p.isActive
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to view this conversation' });
    }

    // Update last read
    try {
      await conversation.updateLastRead(req.user._id);
    } catch (e) {
      console.warn('updateLastRead warning:', e?.message);
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/chat/conversations/swap/:swapId
// @desc    Get conversation by swap ID
// @access  Private
router.get('/conversations/swap/:swapId', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      swapId: req.params.swapId,
      'participants.user': req.user._id,
      'participants.isActive': true
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found for this swap' });
    }

    res.json({ conversationId: conversation._id });
  } catch (error) {
    console.error('Get conversation by swap error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/chat/conversations
// @desc    Create new conversation
// @access  Private
router.post('/conversations', [
  auth,
  body('type').isIn(['direct', 'group']).withMessage('Invalid conversation type'),
  body('participants').optional().isArray().withMessage('Participants must be an array'),
  body('title').optional().trim().isLength({ max: 100 }),
  body('swapId').optional().isMongoId().withMessage('Invalid swap ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, participants, title, description, swapId } = req.body;

    let conversation;

    // Check if swap conversation already exists
    if (swapId) {
      const existingSwapConversation = await Conversation.findOne({
        swapId: swapId,
        'participants.user': req.user._id,
        'participants.isActive': true
      });

      if (existingSwapConversation) {
        return res.status(400).json({ 
          error: 'Conversation already exists for this swap',
          conversation: existingSwapConversation
        });
      }

      // Get swap details to find the other participant
      const swap = await Swap.findById(swapId);
      if (!swap) {
        return res.status(404).json({ error: 'Swap not found' });
      }

      // Determine the other participant.
      // Handle older documents that may have different field names and avoid calling toString on undefined.
      const requester = swap.requester || swap.fromUser;
      const recipient = swap.recipient || swap.toUser;
      if (!requester || !recipient) {
        return res.status(400).json({ error: 'Swap participants are missing on this record' });
      }

      const requesterId = requester.toString();
      const recipientId = recipient.toString();
      const currentUserId = req.user._id.toString();
      const otherUserId = currentUserId === requesterId ? recipient : requester;

      // Create conversation for swap
      conversation = await Conversation.createDirectConversation(req.user._id, otherUserId);
      conversation.swapId = swapId;
      // Title based on skills involved
      const leftSkill = swap.requesterSkill?.name || 'Skill A';
      const rightSkill = swap.recipientSkill?.name || 'Skill B';
      conversation.title = `Swap: ${leftSkill} ↔ ${rightSkill}`;
      await conversation.save();
    } else if (type === 'direct') {
      if (!participants || participants.length !== 1) {
        return res.status(400).json({ error: 'Direct conversations must have exactly one other participant' });
      }

      // Check if conversation already exists
      const existingConversation = await Conversation.findOne({
        type: 'direct',
        'participants.user': { $all: [req.user._id, participants[0]] },
        'participants.isActive': true
      });

      if (existingConversation) {
        return res.status(400).json({ error: 'Direct conversation already exists' });
      }

      conversation = await Conversation.createDirectConversation(req.user._id, participants[0]);
    } else if (type === 'group') {
      if (!title) {
        return res.status(400).json({ error: 'Group conversations require a title' });
      }

      conversation = await Conversation.createGroupConversation(req.user._id, title, description);
      
      // Add other participants
      if (participants) {
        for (const participantId of participants) {
          await conversation.addParticipant(participantId);
        }
      }
    }

    await conversation.populate('participants.user', 'username firstName lastName profilePicture');
    if (swapId) {
      await conversation.populate('swapId', 'title description scheduledDate');
    }

    res.status(201).json({
      message: 'Conversation created successfully',
      conversation
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/chat/conversations/:id/messages
// @desc    Get messages in a conversation
// @access  Private
router.get('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before || '';

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is a participant (support populated/depopped user field)
    const isParticipant = conversation.participants.some(p => {
      const participantId = (p.user && p.user._id) ? p.user._id.toString() : p.user.toString();
      return participantId === req.user._id.toString() && p.isActive;
    });

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to view this conversation' });
    }

    const query = {
      conversation: req.params.id,
      isDeleted: false
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'username firstName lastName profilePicture')
      .populate('replyTo', 'content sender')
      .populate('reactions.user', 'username firstName lastName')
      .populate('readBy.user', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Message.countDocuments(query);

    // Mark messages as read
    const unreadMessages = messages.filter(msg => 
      !msg.readBy.some(read => read.user._id.toString() === req.user._id.toString())
    );

    for (const message of unreadMessages) {
      await message.markAsRead(req.user._id);
    }

    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/chat/conversations/:id/messages
// @desc    Send a message
// @access  Private
router.post('/conversations/:id/messages', [
  auth,
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters'),
  body('replyTo').optional().isMongoId().withMessage('Invalid reply message ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(p => 
      p.user.toString() === req.user._id.toString() && p.isActive
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to send messages in this conversation' });
    }

    const { content, replyTo } = req.body;

    const message = new Message({
      conversation: req.params.id,
      sender: req.user._id,
      content,
      replyTo
    });

    await message.save();
    await message.populate('sender', 'username firstName lastName profilePicture');

    // Emit socket event for real-time message (targeted to participant rooms)
    if (io) {
      const participantIds = conversation.participants
        .filter(p => p.isActive)
        .map(p => p.user.toString());

      console.log('Emitting message to participants:', participantIds);
      participantIds.forEach((participantId) => {
        console.log(`Emitting to user_${participantId}`);
        io.to(`user_${participantId}`).emit('message_received', {
          conversationId: req.params.id,
          message: message,
          participants: participantIds
        });
      });
    } else {
      console.log('Socket.io not available for message emission');
    }

    res.status(201).json({
      message: 'Message sent successfully',
      message: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/chat/messages/:id
// @desc    Edit a message
// @access  Private
router.put('/messages/:id', [
  auth,
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this message' });
    }

    const { content } = req.body;
    await message.editMessage(content);

    await message.populate('sender', 'username firstName lastName profilePicture');

    res.json({
      message: 'Message edited successfully',
      message: message
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/chat/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/messages/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await message.deleteMessage();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/chat/messages/:id/reactions
// @desc    Add/remove reaction to message
// @access  Private
router.post('/messages/:id/reactions', [
  auth,
  body('emoji').isLength({ min: 1, max: 10 }).withMessage('Emoji must be between 1 and 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const { emoji } = req.body;
    await message.addReaction(req.user._id, emoji);

    await message.populate('reactions.user', 'username firstName lastName');

    res.json({
      message: 'Reaction updated successfully',
      message: message
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/chat/conversations/:id/participants
// @desc    Add participant to conversation
// @access  Private
router.post('/conversations/:id/participants', [
  auth,
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('role').optional().isIn(['participant', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is creator or admin
    const userParticipant = conversation.participants.find(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (!userParticipant || (userParticipant.role !== 'creator' && userParticipant.role !== 'admin')) {
      return res.status(403).json({ error: 'Not authorized to add participants' });
    }

    const { userId, role = 'participant' } = req.body;

    await conversation.addParticipant(userId, role);

    await conversation.populate('participants.user', 'username firstName lastName profilePicture');

    res.json({
      message: 'Participant added successfully',
      conversation
    });
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/chat/conversations/:id/participants/:userId
// @desc    Remove participant from conversation
// @access  Private
router.delete('/conversations/:id/participants/:userId', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is creator or admin
    const userParticipant = conversation.participants.find(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (!userParticipant || (userParticipant.role !== 'creator' && userParticipant.role !== 'admin')) {
      return res.status(403).json({ error: 'Not authorized to remove participants' });
    }

    await conversation.removeParticipant(req.params.userId);

    await conversation.populate('participants.user', 'username firstName lastName profilePicture');

    res.json({
      message: 'Participant removed successfully',
      conversation
    });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/chat/conversations/:id/pin/:messageId
// @desc    Pin a message
// @access  Private
router.post('/conversations/:id/pin/:messageId', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is creator or admin
    const userParticipant = conversation.participants.find(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (!userParticipant || (userParticipant.role !== 'creator' && userParticipant.role !== 'admin')) {
      return res.status(403).json({ error: 'Not authorized to pin messages' });
    }

    await conversation.pinMessage(req.params.messageId, req.user._id);

    res.json({
      message: 'Message pinned successfully',
      conversation
    });
  } catch (error) {
    console.error('Pin message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/chat/conversations/:id/pin/:messageId
// @desc    Unpin a message
// @access  Private
router.delete('/conversations/:id/pin/:messageId', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is creator or admin
    const userParticipant = conversation.participants.find(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (!userParticipant || (userParticipant.role !== 'creator' && userParticipant.role !== 'admin')) {
      return res.status(403).json({ error: 'Not authorized to unpin messages' });
    }

    await conversation.unpinMessage(req.params.messageId);

    res.json({
      message: 'Message unpinned successfully',
      conversation
    });
  } catch (error) {
    console.error('Unpin message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/chat/conversations/:id/meeting
// @desc    Create meeting link message
// @access  Private
router.post('/conversations/:id/meeting', [
  auth,
  body('meetingUrl').isURL().withMessage('Invalid meeting URL'),
  body('meetingTitle').trim().isLength({ min: 1, max: 100 }).withMessage('Meeting title must be between 1 and 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(p => 
      p.user.toString() === req.user._id.toString() && p.isActive
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to send messages in this conversation' });
    }

    const { meetingUrl, meetingTitle } = req.body;

    const message = await Message.createMeetingMessage(
      req.params.id,
      req.user._id,
      meetingUrl,
      meetingTitle
    );

    await message.populate('sender', 'username firstName lastName profilePicture');

    res.status(201).json({
      message: 'Meeting link sent successfully',
      message: message
    });
  } catch (error) {
    console.error('Send meeting link error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/chat/search
// @desc    Search conversations and messages
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const query = req.query.q || '';
    const type = req.query.type || 'all'; // 'conversations', 'messages', 'all'

    if (!query.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = {};

    if (type === 'conversations' || type === 'all') {
      const conversations = await Conversation.find({
        'participants.user': req.user._id,
        'participants.isActive': true,
        isActive: true,
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      })
      .populate('participants.user', 'username firstName lastName profilePicture')
      .populate('lastMessage.sender', 'username firstName lastName profilePicture')
      .limit(10);

      results.conversations = conversations;
    }

    if (type === 'messages' || type === 'all') {
      const messages = await Message.find({
        conversation: {
          $in: await Conversation.find({
            'participants.user': req.user._id,
            'participants.isActive': true
          }).distinct('_id')
        },
        content: { $regex: query, $options: 'i' },
        isDeleted: false
      })
      .populate('sender', 'username firstName lastName profilePicture')
      .populate('conversation', 'title')
      .sort({ createdAt: -1 })
      .limit(20);

      results.messages = messages;
    }

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = { router, setIO };