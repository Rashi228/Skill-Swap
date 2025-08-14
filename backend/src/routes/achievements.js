const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const AchievementService = require('../services/achievementService');

let io = null;
const setIO = (socketIO) => {
  io = socketIO;
};

// @route   GET /api/achievements
// @desc    Get user's achievements
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const result = await AchievementService.getUserAchievements(req.user.id);
    
    if (result.success) {
      res.json({
        success: true,
        achievements: result.achievements
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/achievements/check
// @desc    Check and award achievements for user
// @access  Private
router.post('/check', auth, async (req, res) => {
  try {
    const result = await AchievementService.checkAndAwardAchievements(req.user.id);
    
    if (result.success) {
      // Emit real-time achievement update if there are new achievements
      if (result.newAchievements && result.newAchievements.length > 0 && io) {
        io.to(`user_${req.user.id}`).emit('new_achievement', {
          newAchievements: result.newAchievements,
          totalBadges: result.totalBadges,
          level: result.level,
          experience: result.experience
        });
      }

      res.json({
        success: true,
        newAchievements: result.newAchievements,
        totalBadges: result.totalBadges,
        level: result.level,
        experience: result.experience
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/achievements/award/:achievementKey
// @desc    Award specific achievement to user
// @access  Private
router.post('/award/:achievementKey', auth, async (req, res) => {
  try {
    const { achievementKey } = req.params;
    const result = await AchievementService.awardAchievement(req.user.id, achievementKey);
    
    if (result.success) {
      // Emit real-time achievement update
      if (io) {
        io.to(`user_${req.user.id}`).emit('new_achievement', {
          newAchievement: result.newAchievement,
          totalBadges: result.totalBadges,
          level: result.level,
          experience: result.experience
        });
      }

      res.json({
        success: true,
        newAchievement: result.newAchievement,
        totalBadges: result.totalBadges,
        level: result.level,
        experience: result.experience
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Award achievement error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = { router, setIO }; 