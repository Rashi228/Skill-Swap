const express = require('express');
const { body, validationResult } = require('express-validator');
const Webinar = require('../models/Webinar');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/webinars
// @desc    Create a new webinar
// @access  Private
router.post('/', [
  auth,
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('topic')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Topic must be between 2 and 50 characters'),
  body('scheduledDate')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('duration')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max participants must be between 1 and 1000'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      topic,
      scheduledDate,
      duration,
      maxParticipants = 50,
      tags = [],
      isPublic = true,
      price = 0,
      currency = 'USD'
    } = req.body;

    // Check if scheduled date is in the future
    const scheduledDateTime = new Date(scheduledDate);
    if (scheduledDateTime <= new Date()) {
      return res.status(400).json({
        error: 'Scheduled date must be in the future'
      });
    }

    const webinar = new Webinar({
      host: req.user._id,
      title,
      description,
      topic,
      scheduledDate: scheduledDateTime,
      duration,
      maxParticipants,
      tags,
      isPublic,
      price,
      currency
    });

    // Generate meeting details
    const meetingDetails = webinar.generateMeetingDetails();
    await webinar.save();

    // Populate host information
    await webinar.populate('host', 'username firstName lastName profilePicture');

    res.status(201).json({
      message: 'Webinar created successfully',
      webinar
    });
  } catch (error) {
    console.error('Create webinar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/webinars
// @desc    Get all public webinars with pagination and filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const topic = req.query.topic;
    const status = req.query.status;
    const hostId = req.query.hostId;
    const search = req.query.search;

    const query = { isPublic: true };

    if (topic) {
      query.topic = { $regex: topic, $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    if (hostId) {
      query.host = hostId;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } }
      ];
    }

    const webinars = await Webinar.find(query)
      .populate('host', 'username firstName lastName profilePicture')
      .sort({ scheduledDate: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Webinar.countDocuments(query);

    res.json({
      webinars,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get webinars error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/webinars/my
// @desc    Get current user's webinars
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const query = { host: req.user._id };

    if (status) {
      query.status = status;
    }

    const webinars = await Webinar.find(query)
      .populate('host', 'username firstName lastName profilePicture')
      .populate('participants.user', 'username firstName lastName profilePicture')
      .sort({ scheduledDate: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Webinar.countDocuments(query);

    res.json({
      webinars,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get my webinars error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/webinars/meeting/:meetingId
// @desc    Get webinar by meeting ID
// @access  Public
router.get('/meeting/:meetingId', async (req, res) => {
  try {
    const webinar = await Webinar.findOne({ meetingId: req.params.meetingId })
      .populate('host', 'username firstName lastName profilePicture rating')
      .populate('participants.user', 'username firstName lastName profilePicture');

    if (!webinar) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Check if user is authenticated and is a participant
    let isParticipant = false;
    if (req.user) {
      isParticipant = webinar.participants.some(p => p.user._id.toString() === req.user._id.toString());
    }

    res.json({
      webinar,
      isParticipant,
      isHost: req.user ? webinar.host._id.toString() === req.user._id.toString() : false
    });
  } catch (error) {
    console.error('Get webinar by meeting ID error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/webinars/:id/generate-meeting-links
// @desc    Generate meeting links for existing webinar (host only)
// @access  Private
router.post('/:id/generate-meeting-links', auth, async (req, res) => {
  try {
    const webinar = await Webinar.findById(req.params.id);

    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }

    if (webinar.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this webinar' });
    }

    // Generate meeting details if they don't exist
    if (!webinar.meetingId || !webinar.meetingLink) {
      webinar.generateMeetingDetails();
      await webinar.save();
    }

    await webinar.populate('host', 'username firstName lastName profilePicture');

    res.json({
      message: 'Meeting links generated successfully',
      webinar
    });
  } catch (error) {
    console.error('Generate meeting links error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/webinars/:id
// @desc    Get webinar by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const webinar = await Webinar.findById(req.params.id)
      .populate('host', 'username firstName lastName profilePicture rating')
      .populate('participants.user', 'username firstName lastName profilePicture');

    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }

    // Check if user is authenticated and is a participant
    let isParticipant = false;
    if (req.user) {
      isParticipant = webinar.participants.some(p => p.user._id.toString() === req.user._id.toString());
    }

    res.json({
      webinar,
      isParticipant,
      isHost: req.user ? webinar.host._id.toString() === req.user._id.toString() : false
    });
  } catch (error) {
    console.error('Get webinar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/webinars/:id
// @desc    Update webinar
// @access  Private (host only)
router.put('/:id', [
  auth,
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('topic')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Topic must be between 2 and 50 characters'),
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max participants must be between 1 and 1000')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const webinar = await Webinar.findById(req.params.id);

    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }

    if (webinar.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this webinar' });
    }

    if (webinar.status !== 'upcoming') {
      return res.status(400).json({ error: 'Cannot update webinar that is not upcoming' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        webinar[key] = req.body[key];
      }
    });

    await webinar.save();

    await webinar.populate('host', 'username firstName lastName profilePicture');

    res.json({
      message: 'Webinar updated successfully',
      webinar
    });
  } catch (error) {
    console.error('Update webinar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/webinars/:id
// @desc    Delete webinar
// @access  Private (host only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const webinar = await Webinar.findById(req.params.id);

    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }

    if (webinar.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this webinar' });
    }

    if (webinar.status !== 'upcoming') {
      return res.status(400).json({ error: 'Cannot delete webinar that is not upcoming' });
    }

    await webinar.deleteOne();

    res.json({ message: 'Webinar deleted successfully' });
  } catch (error) {
    console.error('Delete webinar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/webinars/:id/join
// @desc    Join a webinar
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
  try {
    const webinar = await Webinar.findById(req.params.id);

    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }

    if (!webinar.isPublic) {
      return res.status(403).json({ error: 'This webinar is not public' });
    }

    if (webinar.host.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Host cannot join their own webinar' });
    }

    await webinar.addParticipant(req.user._id);

    await webinar.populate('host', 'username firstName lastName profilePicture');

    res.json({
      message: 'Successfully joined webinar',
      webinar
    });
  } catch (error) {
    console.error('Join webinar error:', error);
    res.status(400).json({ error: error.message });
  }
});

// @route   POST /api/webinars/:id/leave
// @desc    Leave a webinar
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const webinar = await Webinar.findById(req.params.id);

    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }

    await webinar.removeParticipant(req.user._id);

    await webinar.populate('host', 'username firstName lastName profilePicture');

    res.json({
      message: 'Successfully left webinar',
      webinar
    });
  } catch (error) {
    console.error('Leave webinar error:', error);
    res.status(400).json({ error: error.message });
  }
});

// @route   PUT /api/webinars/:id/status
// @desc    Update webinar status (host only)
// @access  Private
router.put('/:id/status', [
  auth,
  body('status')
    .isIn(['upcoming', 'live', 'completed', 'cancelled'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const webinar = await Webinar.findById(req.params.id);

    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }

    if (webinar.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this webinar' });
    }

    webinar.status = req.body.status;
    await webinar.save();

    await webinar.populate('host', 'username firstName lastName profilePicture');

    res.json({
      message: 'Webinar status updated successfully',
      webinar
    });
  } catch (error) {
    console.error('Update webinar status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 