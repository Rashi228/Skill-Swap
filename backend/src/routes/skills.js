const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/skills
// @desc    Get all skills with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const search = req.query.search || '';
    const category = req.query.category || '';
    const level = req.query.level || '';

    // Aggregate skills from all users
    const pipeline = [
      { $match: { isActive: true } },
      { $unwind: '$skills' },
      {
        $group: {
          _id: '$skills.name',
          count: { $sum: 1 },
          levels: { $addToSet: '$skills.level' },
          users: { $addToSet: '$_id' },
          avgRating: { $avg: '$rating.average' }
        }
      },
      {
        $project: {
          name: '$_id',
          count: 1,
          levels: 1,
          userCount: { $size: '$users' },
          avgRating: { $round: ['$avgRating', 1] }
        }
      },
      { $sort: { count: -1 } }
    ];

    if (search) {
      pipeline.unshift({
        $match: {
          isActive: true,
          'skills.name': { $regex: search, $options: 'i' }
        }
      });
    }

    if (level) {
      pipeline.unshift({
        $match: {
          isActive: true,
          'skills.level': level
        }
      });
    }

    const skills = await User.aggregate(pipeline);

    res.json({ skills });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/skills/popular
// @desc    Get popular skills
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const popularSkills = await User.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$skills' },
      {
        $group: {
          _id: '$skills.name',
          count: { $sum: 1 },
          userCount: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          name: '$_id',
          count: 1,
          userCount: { $size: '$userCount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    res.json({ skills: popularSkills });
  } catch (error) {
    console.error('Get popular skills error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/skills/users/:skillName
// @desc    Get users with a specific skill
// @access  Public
router.get('/users/:skillName', async (req, res) => {
  try {
    const { skillName } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const level = req.query.level || '';

    const query = {
      isActive: true,
      'skills.name': { $regex: skillName, $options: 'i' }
    };

    if (level) {
      query['skills.level'] = level;
    }

    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ 'rating.average': -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      skillName,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get skill users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/skills/categories
// @desc    Get skill categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      'Programming',
      'Design',
      'Marketing',
      'Business',
      'Creative',
      'Technical',
      'Language',
      'Music',
      'Sports',
      'Cooking',
      'Craft',
      'Other'
    ];

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/skills/levels
// @desc    Get skill levels
// @access  Public
router.get('/levels', async (req, res) => {
  try {
    const levels = [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
      { value: 'expert', label: 'Expert' }
    ];

    res.json({ levels });
  } catch (error) {
    console.error('Get levels error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 