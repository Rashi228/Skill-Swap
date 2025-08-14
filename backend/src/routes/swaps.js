const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Swap = require('../models/Swap');
const User = require('../models/User');
const Notification = require('../models/Notification');

const router = express.Router();

// Get socket.io instance
let io;
const setIO = (socketIO) => {
  io = socketIO;
};

// @route   POST /api/swaps/request
// @desc    Send a swap request
// @access  Private
router.post('/request', [
  auth,
  body('toUserId').isMongoId().withMessage('Valid user ID required'),
  body('skillToTeach').notEmpty().withMessage('Skill to teach is required'),
  body('skillToLearn').notEmpty().withMessage('Skill to learn is required'),
  body('message').optional().isLength({ max: 500 }).withMessage('Message too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { toUserId, skillToTeach, skillToLearn, message } = req.body;

    // Check if recipient exists
    const recipient = await User.findById(toUserId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Check if recipient is not the same as requester
    if (toUserId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot send swap request to yourself' });
    }

    // Check if there's already a pending swap request between these users
    const existingSwap = await Swap.findOne({
      $or: [
        { requester: req.user._id, recipient: toUserId, status: 'pending' },
        { requester: toUserId, recipient: req.user._id, status: 'pending' }
      ]
    });

    if (existingSwap) {
      return res.status(400).json({ error: 'A swap request already exists between you and this user' });
    }

    // Create the swap request
    const swap = new Swap({
      requester: req.user._id,
      recipient: toUserId,
      requesterSkill: {
        name: skillToTeach
      },
      recipientSkill: {
        name: skillToLearn
      },
      message: message || ''
    });

    await swap.save();

    // Create notification for recipient
    const notification = new Notification({
      recipient: toUserId,
      sender: req.user._id,
      type: 'swap_request',
      title: 'New Swap Request',
      message: `${req.user.firstName || req.user.username} wants to swap skills with you!`,
      relatedSwap: swap._id
    });
    await notification.save();

    // Populate user details for response
    await swap.populate('requester', 'firstName lastName username');
    await swap.populate('recipient', 'firstName lastName username');

    // Emit socket event for real-time notification (target only the recipient)
    if (io) {
      io.to(`user_${toUserId}`).emit('new_swap_request', {
        swapId: swap._id,
        fromUser: {
          _id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          username: req.user.username
        },
        toUserId: toUserId,
        message: `${req.user.firstName || req.user.username} wants to swap skills with you!`
      });
    }

    res.json({
      message: 'Swap request sent successfully',
      swap
    });
  } catch (error) {
    console.error('Send swap request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/swaps/my-swaps
// @desc    Get user's swaps (as requester or recipient)
// @access  Private
router.get('/my-swaps', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status; // optional filter

    const query = {
      $or: [
        { requester: req.user._id },
        { recipient: req.user._id }
      ]
    };

    if (status) {
      query.status = status;
    }

    const swaps = await Swap.find(query)
      .populate('requester', 'firstName lastName username profilePicture')
      .populate('recipient', 'firstName lastName username profilePicture')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Swap.countDocuments(query);

    res.json({
      swaps,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get my swaps error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/swaps/calendar
// @desc    Get user's calendar events (scheduled swaps)
// @access  Private
router.get('/calendar', auth, async (req, res) => {
  try {
    const now = new Date();
    const monthParam = Number(req.query.month);
    const yearParam = Number(req.query.year);

    const month = Number.isInteger(monthParam) && monthParam >= 1 && monthParam <= 12
      ? monthParam
      : now.getMonth() + 1;
    const year = Number.isInteger(yearParam) && yearParam >= 1970 && yearParam <= 9999
      ? yearParam
      : now.getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const query = {
      $or: [
        { requester: req.user._id },
        { recipient: req.user._id }
      ],
      scheduledDate: {
        $gte: startDate,
        $lte: endDate
      },
      status: { $in: ['accepted', 'completed'] }
    };

    const swaps = await Swap.find(query)
      .populate('requester', 'firstName lastName username')
      .populate('recipient', 'firstName lastName username')
      .sort({ scheduledDate: 1 })
      .exec();

    res.json({ swaps, range: { month, year } });
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ error: 'Failed to load calendar events', details: error.message });
  }
});

// IMPORTANT: Place fixed-path routes BEFORE parameterized routes to avoid conflicts
// moved earlier above `/:id` route

// @route   GET /api/swaps/:id
// @desc    Get specific swap details
// @access  Private
router.get('/:id', auth, async (req, res, next) => {
  try {
    // Defensive: If a non-ObjectId sneaks in, return 400 instead of throwing a CastError
    if (!/^[a-fA-F0-9]{24}$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid swap ID' });
    }
    const swap = await Swap.findById(req.params.id)
      .populate('requester', 'firstName lastName username profilePicture')
      .populate('recipient', 'firstName lastName username profilePicture');

    if (!swap) {
      return res.status(404).json({ error: 'Swap not found' });
    }

    // Check if user is involved in this swap
    if (swap.requester._id.toString() !== req.user._id.toString() && 
        swap.recipient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this swap' });
    }

    res.json({ swap });
  } catch (error) {
    console.error('Get swap error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/swaps/:id/respond
// @desc    Accept or reject a swap request
// @access  Private
router.put('/:id/respond', [
  auth,
  body('action').isIn(['accept', 'reject']).withMessage('Action must be accept or reject')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { action } = req.body;

    const swap = await Swap.findById(req.params.id);
    if (!swap) {
      return res.status(404).json({ error: 'Swap not found' });
    }

    // Check if user is the recipient
    if (swap.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to respond to this swap' });
    }

    // Check if swap is still pending
    if (swap.status !== 'pending') {
      return res.status(400).json({ error: 'Swap request has already been responded to' });
    }

    // Update swap status
    swap.status = action === 'accept' ? 'accepted' : 'rejected';
    swap.respondedAt = new Date();

    await swap.save();

    // Create notification for requester
    const notification = new Notification({
      recipient: swap.requester,
      sender: req.user._id,
      type: action === 'accept' ? 'swap_accepted' : 'swap_rejected',
      title: action === 'accept' ? 'Swap Request Accepted' : 'Swap Request Rejected',
      message: action === 'accept' 
        ? `${req.user.firstName || req.user.username} accepted your swap request!`
        : `${req.user.firstName || req.user.username} rejected your swap request.`,
      relatedSwap: swap._id
    });
    await notification.save();

    // Populate user details for response
    await swap.populate('requester', 'firstName lastName username');
    await swap.populate('recipient', 'firstName lastName username');

    // Emit socket event for real-time notification (target only the requester)
    if (io) {
      io.to(`user_${swap.requester.toString()}`).emit('swap_response_received', {
        swapId: swap._id,
        action: action === 'accept' ? 'accepted' : 'rejected',
        fromUser: {
          _id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          username: req.user.username
        },
        toUserId: swap.requester.toString(),
        message: `Your swap request has been ${action === 'accept' ? 'accepted' : 'rejected'}`
      });
    }

    res.json({
      message: `Swap request ${action}ed successfully`,
      swap
    });
  } catch (error) {
    console.error('Respond to swap error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/swaps/:id/cancel
// @desc    Cancel an active swap
// @access  Private
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);
    if (!swap) {
      return res.status(404).json({ error: 'Swap not found' });
    }

    // Check if user is involved in this swap
    if (swap.requester.toString() !== req.user._id.toString() && 
        swap.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to cancel this swap' });
    }

    // Check if swap can be cancelled
    if (!['pending', 'accepted'].includes(swap.status)) {
      return res.status(400).json({ error: 'Swap cannot be cancelled in its current state' });
    }

    swap.status = 'cancelled';
    await swap.save();

    res.json({
      message: 'Swap cancelled successfully',
      swap
    });
  } catch (error) {
    console.error('Cancel swap error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/swaps/:id/complete
// @desc    Mark a swap as completed
// @access  Private
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);
    if (!swap) {
      return res.status(404).json({ error: 'Swap not found' });
    }

    // Check if user is involved in this swap
    if (swap.requester.toString() !== req.user._id.toString() && 
        swap.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to complete this swap' });
    }

    // Check if swap is accepted
    if (swap.status !== 'accepted') {
      return res.status(400).json({ error: 'Only accepted swaps can be completed' });
    }

    swap.status = 'completed';
    swap.completedAt = new Date();
    await swap.save();

    res.json({
      message: 'Swap completed successfully',
      swap
    });
  } catch (error) {
    console.error('Complete swap error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/swaps/:id/rate
// @desc    Rate a completed swap
// @access  Private
router.post('/:id/rate', [
  auth,
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isLength({ max: 500 }).withMessage('Review too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rating, review } = req.body;

    const swap = await Swap.findById(req.params.id);
    if (!swap) {
      return res.status(404).json({ error: 'Swap not found' });
    }

    // Check if user is involved in this swap
    if (swap.requester.toString() !== req.user._id.toString() && 
        swap.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to rate this swap' });
    }

    // Check if swap is completed
    if (swap.status !== 'completed') {
      return res.status(400).json({ error: 'Only completed swaps can be rated' });
    }

    // Check if user can rate
    if (!swap.canRate(req.user._id)) {
      return res.status(400).json({ error: 'You have already rated this swap' });
    }

    // Add rating
    if (swap.requester.toString() === req.user._id.toString()) {
      swap.requesterRating = {
        rating,
        review: review || '',
        createdAt: new Date()
      };
    } else {
      swap.recipientRating = {
        rating,
        review: review || '',
        createdAt: new Date()
      };
    }

    await swap.save();

    // Update user reputation based on the rating
    const User = require('../models/User');
    const ratedUserId = swap.requester.toString() === req.user._id.toString() 
      ? swap.recipient 
      : swap.requester;

    const ratedUser = await User.findById(ratedUserId);
    if (ratedUser) {
      // Get all ratings for this user
      const allSwaps = await Swap.find({
        $or: [
          { requester: ratedUserId, 'requesterRating.rating': { $exists: true } },
          { recipient: ratedUserId, 'recipientRating.rating': { $exists: true } }
        ]
      });

      let totalRating = 0;
      let ratingCount = 0;

      allSwaps.forEach(swap => {
        if (swap.requester.toString() === ratedUserId.toString() && swap.requesterRating) {
          totalRating += swap.requesterRating.rating;
          ratingCount++;
        }
        if (swap.recipient.toString() === ratedUserId.toString() && swap.recipientRating) {
          totalRating += swap.recipientRating.rating;
          ratingCount++;
        }
      });

      // Update user's rating
      ratedUser.rating.average = ratingCount > 0 ? totalRating / ratingCount : 0;
      ratedUser.rating.count = ratingCount;
      await ratedUser.save();

      // Check for new achievements
      const newAchievements = [];
      const currentBadges = ratedUser.achievements.badges.map(badge => badge.name);

      // Check for reputation-based achievements
      if (ratedUser.rating.average >= 4.0 && ratedUser.rating.count >= 5 && !currentBadges.includes('Well Respected')) {
        newAchievements.push({
          name: 'Well Respected',
          description: 'Maintain 4.0+ rating with 5+ reviews',
          icon: '⭐',
          category: 'reputation'
        });
      }

      if (ratedUser.rating.average >= 4.5 && ratedUser.rating.count >= 10 && !currentBadges.includes('Highly Rated')) {
        newAchievements.push({
          name: 'Highly Rated',
          description: 'Maintain 4.5+ rating with 10+ reviews',
          icon: '🏆',
          category: 'reputation'
        });
      }

      // Add new achievements
      if (newAchievements.length > 0) {
        ratedUser.achievements.badges.push(...newAchievements);
        ratedUser.achievements.totalBadges = ratedUser.achievements.badges.length;
        
        // Recalculate experience and level
        ratedUser.achievements.experience = ratedUser.achievements.totalBadges * 10 + ratedUser.rating.count * 5 + Math.floor(ratedUser.wallet.earned / 10);
        ratedUser.achievements.level = Math.floor(ratedUser.achievements.experience / 100) + 1;
        
        await ratedUser.save();
      }
    }

    res.json({
      message: 'Rating submitted successfully',
      swap
    });
  } catch (error) {
    console.error('Rate swap error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/swaps/:id/schedule
// @desc    Schedule a swap session
// @access  Private
router.put('/:id/schedule', [
  auth,
  body('scheduledDate').isISO8601().withMessage('Valid date required'),
  body('eventDetails').isObject().withMessage('Event details required'),
  body('eventDetails.title').notEmpty().withMessage('Event title required'),
  body('eventDetails.startTime').notEmpty().withMessage('Start time required'),
  body('eventDetails.endTime').notEmpty().withMessage('End time required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { scheduledDate, eventDetails } = req.body;

    const swap = await Swap.findById(req.params.id);
    if (!swap) {
      return res.status(404).json({ error: 'Swap not found' });
    }

    // Check if user is involved in this swap
    if (swap.requester.toString() !== req.user._id.toString() && 
        swap.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to schedule this swap' });
    }

    // Check if swap is accepted
    if (swap.status !== 'accepted') {
      return res.status(400).json({ error: 'Only accepted swaps can be scheduled' });
    }

    // Update swap with scheduled date and event details
    swap.scheduledDate = new Date(scheduledDate);
    swap.eventDetails = eventDetails;

    // Create a session entry
    const sessionDate = new Date(scheduledDate);
    const [startHour, startMinute] = eventDetails.startTime.split(':');
    const [endHour, endMinute] = eventDetails.endTime.split(':');
    
    sessionDate.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
    
    const duration = (parseInt(endHour) - parseInt(startHour)) * 60 + (parseInt(endMinute) - parseInt(startMinute));

    swap.sessions.push({
      date: sessionDate,
      duration: duration,
      type: 'requester_teaching', // Default to requester teaching first
      status: 'scheduled',
      notes: eventDetails.description || ''
    });

    await swap.save();

    // Create notification for the other user
    const otherUserId = swap.requester.toString() === req.user._id.toString() 
      ? swap.recipient 
      : swap.requester;

    const notification = new Notification({
      recipient: otherUserId,
      sender: req.user._id,
      type: 'swap_scheduled',
      title: 'Swap Session Scheduled',
      message: `A swap session has been scheduled for ${new Date(scheduledDate).toLocaleDateString()} at ${eventDetails.startTime}`,
      relatedSwap: swap._id
    });
    await notification.save();

    // Populate user details for response
    await swap.populate('requester', 'firstName lastName username');
    await swap.populate('recipient', 'firstName lastName username');

    // Emit socket events for real-time calendar updates to both users
    if (io) {
      // Get updated calendar data for both users
      const requesterSwaps = await Swap.find({
        $or: [
          { requester: swap.requester, status: { $in: ['accepted', 'scheduled', 'completed'] } },
          { recipient: swap.requester, status: { $in: ['accepted', 'scheduled', 'completed'] } }
        ]
      }).populate('requester recipient', 'firstName lastName username');

      const recipientSwaps = await Swap.find({
        $or: [
          { requester: swap.recipient, status: { $in: ['accepted', 'scheduled', 'completed'] } },
          { recipient: swap.recipient, status: { $in: ['accepted', 'scheduled', 'completed'] } }
        ]
      }).populate('requester recipient', 'firstName lastName username');

      // Emit to requester
      io.to(`user_${swap.requester}`).emit('calendar_data_updated', {
        swaps: requesterSwaps
      });

      // Emit to recipient
      io.to(`user_${swap.recipient}`).emit('calendar_data_updated', {
        swaps: recipientSwaps
      });
    }

    res.json({
      message: 'Swap session scheduled successfully',
      swap
    });
  } catch (error) {
    console.error('Schedule swap error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// duplicate /calendar route removed

module.exports = { router, setIO }; 