const express = require('express');
const { auth } = require('../middleware/auth');
const CreditService = require('../services/creditService');

const router = express.Router();

// @route   POST /api/credits/daily-login
// @desc    Award daily login credit (for testing)
// @access  Private
router.post('/daily-login', auth, async (req, res) => {
  try {
    const result = await CreditService.awardDailyLoginCredit(req.user._id);
    
    if (result.success) {
      res.json({
        message: result.message,
        newBalance: result.newBalance,
        earned: result.earned,
        spent: result.spent,
        transaction: result.transaction
      });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Daily login credit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/credits/profile-completion
// @desc    Award profile completion credit (for testing)
// @access  Private
router.post('/profile-completion', auth, async (req, res) => {
  try {
    const result = await CreditService.awardProfileCompletionCredit(req.user._id);
    
    if (result.success) {
      res.json({
        message: result.message,
        newBalance: result.newBalance,
        earned: result.earned,
        spent: result.spent,
        transaction: result.transaction
      });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Profile completion credit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/credits/skill
// @desc    Award skill credit (for testing)
// @access  Private
router.post('/skill', auth, async (req, res) => {
  try {
    const { skillName } = req.body;
    
    if (!skillName) {
      return res.status(400).json({ error: 'Skill name is required' });
    }

    const result = await CreditService.awardSkillCredit(req.user._id, skillName);
    
    if (result.success) {
      res.json({
        message: result.message,
        newBalance: result.newBalance,
        earned: result.earned,
        spent: result.spent,
        transaction: result.transaction
      });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Skill credit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/credits/first-swap
// @desc    Award first swap credit (for testing)
// @access  Private
router.post('/first-swap', auth, async (req, res) => {
  try {
    const result = await CreditService.awardFirstSwapCredit(req.user._id);
    
    if (result.success) {
      res.json({
        message: result.message,
        newBalance: result.newBalance,
        earned: result.earned,
        spent: result.spent,
        transaction: result.transaction
      });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('First swap credit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/credits/swap-completion
// @desc    Award swap completion credit (for testing)
// @access  Private
router.post('/swap-completion', auth, async (req, res) => {
  try {
    const { swapType } = req.body; // 'teacher' or 'student'
    
    const result = await CreditService.awardSwapCompletionCredit(req.user._id, swapType);
    
    if (result.success) {
      res.json({
        message: result.message,
        newBalance: result.newBalance,
        earned: result.earned,
        spent: result.spent,
        transaction: result.transaction
      });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Swap completion credit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/credits/high-rating
// @desc    Award high rating credit (for testing)
// @access  Private
router.post('/high-rating', auth, async (req, res) => {
  try {
    const result = await CreditService.awardHighRatingCredit(req.user._id);
    
    if (result.success) {
      res.json({
        message: result.message,
        newBalance: result.newBalance,
        earned: result.earned,
        spent: result.spent,
        transaction: result.transaction
      });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('High rating credit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/credits/spend-swap
// @desc    Spend credits for swap participation (for testing)
// @access  Private
router.post('/spend-swap', auth, async (req, res) => {
  try {
    const result = await CreditService.spendSwapParticipationCredit(req.user._id);
    
    if (result.success) {
      res.json({
        message: result.message,
        newBalance: result.newBalance,
        earned: result.earned,
        spent: result.spent,
        transaction: result.transaction
      });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Swap participation credit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/credits/check-milestones
// @desc    Check and award milestone credits (for testing)
// @access  Private
router.post('/check-milestones', auth, async (req, res) => {
  try {
    const result = await CreditService.checkAndAwardMilestoneCredits(req.user._id);
    
    if (result.success) {
      res.json({
        message: result.message,
        newBalance: result.newBalance,
        earned: result.earned,
        spent: result.spent,
        transaction: result.transaction
      });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Milestone credit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/credits/premium-feature
// @desc    Spend credits for premium features (for testing)
// @access  Private
router.post('/premium-feature', auth, async (req, res) => {
  try {
    const { featureName, cost } = req.body;
    
    if (!featureName || !cost) {
      return res.status(400).json({ error: 'Feature name and cost are required' });
    }

    const result = await CreditService.spendPremiumFeatureCredit(req.user._id, featureName, cost);
    
    if (result.success) {
      res.json({
        message: result.message,
        newBalance: result.newBalance,
        spent: result.spent,
        transaction: result.transaction
      });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Premium feature credit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/credits/webinar
// @desc    Spend credits for webinar participation (for testing)
// @access  Private
router.post('/webinar', auth, async (req, res) => {
  try {
    const { webinarName } = req.body;
    
    if (!webinarName) {
      return res.status(400).json({ error: 'Webinar name is required' });
    }

    const result = await CreditService.spendWebinarCredit(req.user._id, webinarName);
    
    if (result.success) {
      res.json({
        message: result.message,
        newBalance: result.newBalance,
        spent: result.spent,
        transaction: result.transaction
      });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Webinar credit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 