const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const CreditService = require('../services/creditService');

const router = express.Router();

// Socket.io instance (will be set by server.js)
let io = null;
const setIO = (socketIO) => {
  io = socketIO;
};

module.exports = { router, setIO };

// @route   GET /api/users
// @desc    Get all users (with pagination and filters)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skill = req.query.skill || '';
    const location = req.query.location || '';

    const query = { 
      isActive: true,
      _id: { $ne: req.user._id } // Exclude current user
    };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    if (skill) {
      query['skills.name'] = { $regex: skill, $options: 'i' };
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', [
  auth,
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('location').optional().trim(),
  body('age').optional().isInt({ min: 13, max: 120 }),
  body('language').optional().trim(),
  body('profilePicture').optional().trim(),
  body('links').optional().isArray()
], async (req, res) => {
  try {
    console.log('Profile update request received');
    console.log('User from auth:', req.user);
    console.log('Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Found user:', user.username);

    const { firstName, lastName, bio, location, age, language, profilePicture, links } = req.body;
    
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (age !== undefined) user.age = age;
    if (language !== undefined) user.language = language;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (links !== undefined) user.links = links;

    await user.save();
    console.log('Profile saved successfully');

    // Emit socket event for profile update
    if (io) {
      io.emit('user_profile_updated', {
        userId: user._id,
        profile: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          bio: user.bio,
          location: user.location,
          age: user.age,
          language: user.language,
          profilePicture: user.profilePicture,
          links: user.links,
          skills: user.skills,
          skillsToLearn: user.skillsToLearn,
          rating: user.rating,
          wallet: user.wallet
        }
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        bio: user.bio,
        location: user.location,
        age: user.age,
        language: user.language,
        profilePicture: user.profilePicture,
        links: user.links,
        skills: user.skills,
        skillsToLearn: user.skillsToLearn,
        rating: user.rating,
        wallet: user.wallet
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/skills
// @desc    Update current user skills
// @access  Private
router.put('/skills', [
  auth,
  body('skills').isArray(),
  body('skillsToLearn').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { skills, skillsToLearn } = req.body;
    
    const oldSkills = [...user.skills];
    
    if (skills !== undefined) user.skills = skills;
    if (skillsToLearn !== undefined) user.skillsToLearn = skillsToLearn;

    await user.save();

    // Award credits for new skills
    const newSkills = skills || [];
    const addedSkills = newSkills.filter(newSkill => 
      !oldSkills.some(oldSkill => oldSkill.name === newSkill.name)
    );

    for (const skill of addedSkills) {
      await CreditService.awardSkillCredit(user._id, skill.name);
    }

    // Check for new achievements after updating skills
    const newAchievements = [];
    const currentBadges = user.achievements.badges.map(badge => badge.name);

    // Check for skill-based achievements
    if (user.skills.length >= 5 && !currentBadges.includes('Skillful Teacher')) {
      newAchievements.push({
        name: 'Skillful Teacher',
        description: 'Added 5+ skills to teach',
        icon: '🎓',
        category: 'skill'
      });
    }

    if (user.skills.length >= 10 && !currentBadges.includes('Expert Teacher')) {
      newAchievements.push({
        name: 'Expert Teacher',
        description: 'Added 10+ skills to teach',
        icon: '👨‍🏫',
        category: 'skill'
      });
    }

    // Add new achievements
    if (newAchievements.length > 0) {
      user.achievements.badges.push(...newAchievements);
      user.achievements.totalBadges = user.achievements.badges.length;
      
      // Recalculate experience and level
      user.achievements.experience = user.achievements.totalBadges * 10 + user.rating.count * 5 + Math.floor(user.wallet.earned / 10);
      user.achievements.level = Math.floor(user.achievements.experience / 100) + 1;
      
      await user.save();

      // Emit socket event for new achievements
      if (io) {
        newAchievements.forEach(achievement => {
          io.to(`user_${user._id}`).emit('new_achievement', {
            achievement
          });
        });
      }
    }

    // Emit socket event for profile update (skills changed)
    if (io) {
      io.emit('user_profile_updated', {
        userId: user._id,
        profile: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          bio: user.bio,
          location: user.location,
          age: user.age,
          language: user.language,
          profilePicture: user.profilePicture,
          links: user.links,
          skills: user.skills,
          skillsToLearn: user.skillsToLearn,
          rating: user.rating,
          wallet: user.wallet
        }
      });
    }

    res.json({
      message: 'Skills updated successfully',
      skills: user.skills,
      skillsToLearn: user.skillsToLearn,
      newAchievements: newAchievements.length > 0 ? newAchievements : null
    });
  } catch (error) {
    console.error('Update skills error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile (admin or own profile)
// @access  Private
router.put('/:id', [
  auth,
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('location').optional().trim(),
  body('profilePicture').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is updating their own profile or is admin
    if (req.params.id !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { firstName, lastName, bio, location, profilePicture } = req.body;
    
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        bio: user.bio,
        location: user.location,
        profilePicture: user.profilePicture,
        skills: user.skills,
        skillsToLearn: user.skillsToLearn,
        rating: user.rating,
        wallet: user.wallet
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/:id/skills
// @desc    Update user skills (admin or own skills)
// @access  Private
router.put('/:id/skills', [
  auth,
  body('skills').isArray(),
  body('skillsToLearn').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.params.id !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { skills, skillsToLearn } = req.body;
    
    if (skills !== undefined) user.skills = skills;
    if (skillsToLearn !== undefined) user.skillsToLearn = skillsToLearn;

    await user.save();

    res.json({
      message: 'Skills updated successfully',
      skills: user.skills,
      skillsToLearn: user.skillsToLearn
    });
  } catch (error) {
    console.error('Update skills error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete - set isActive to false
    user.isActive = false;
    await user.save();

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/achievements
// @desc    Get current user achievements
// @access  Private
router.get('/achievements', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('achievements rating wallet');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      achievements: user.achievements,
      rating: user.rating,
      wallet: user.wallet
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/users/achievements/check
// @desc    Check and award achievements based on user activity
// @access  Private
router.post('/achievements/check', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newAchievements = [];
    const currentBadges = user.achievements.badges.map(badge => badge.name);

    // Check for credit-based achievements
    if (user.wallet.earned >= 100 && !currentBadges.includes('Credit Collector')) {
      newAchievements.push({
        name: 'Credit Collector',
        description: 'Earned 100+ credits',
        icon: '💰',
        category: 'credits'
      });
    }

    if (user.wallet.earned >= 500 && !currentBadges.includes('Credit Master')) {
      newAchievements.push({
        name: 'Credit Master',
        description: 'Earned 500+ credits',
        icon: '💎',
        category: 'credits'
      });
    }

    // Check for reputation-based achievements
    if (user.rating.average >= 4.0 && user.rating.count >= 5 && !currentBadges.includes('Well Respected')) {
      newAchievements.push({
        name: 'Well Respected',
        description: 'Maintain 4.0+ rating with 5+ reviews',
        icon: '⭐',
        category: 'reputation'
      });
    }

    if (user.rating.average >= 4.5 && user.rating.count >= 10 && !currentBadges.includes('Highly Rated')) {
      newAchievements.push({
        name: 'Highly Rated',
        description: 'Maintain 4.5+ rating with 10+ reviews',
        icon: '🏆',
        category: 'reputation'
      });
    }

    // Check for skill-based achievements
    if (user.skills.length >= 5 && !currentBadges.includes('Skillful Teacher')) {
      newAchievements.push({
        name: 'Skillful Teacher',
        description: 'Added 5+ skills to teach',
        icon: '🎓',
        category: 'skill'
      });
    }

    if (user.skills.length >= 10 && !currentBadges.includes('Expert Teacher')) {
      newAchievements.push({
        name: 'Expert Teacher',
        description: 'Added 10+ skills to teach',
        icon: '👨‍🏫',
        category: 'skill'
      });
    }

    // Add new achievements to user
    if (newAchievements.length > 0) {
      user.achievements.badges.push(...newAchievements);
      user.achievements.totalBadges = user.achievements.badges.length;
      
      // Calculate level based on total badges and experience
      user.achievements.experience = user.achievements.totalBadges * 10 + user.rating.count * 5 + Math.floor(user.wallet.earned / 10);
      user.achievements.level = Math.floor(user.achievements.experience / 100) + 1;
      
      await user.save();
    }

    res.json({
      message: 'Achievements checked successfully',
      newAchievements,
      achievements: user.achievements
    });
  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}); 