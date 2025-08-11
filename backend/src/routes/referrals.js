const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/referrals/validate/:code
// @desc    Validate a referral code
// @access  Public
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({ error: 'Referral code is required' });
    }

    const referrer = await User.findOne({ referralCode: code.toUpperCase() });
    
    if (!referrer) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    res.json({
      valid: true,
      referrer: {
        id: referrer._id,
        username: referrer.username,
        firstName: referrer.firstName,
        lastName: referrer.lastName
      }
    });
  } catch (error) {
    console.error('Validate referral code error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/referrals/award-credits
// @desc    Award credits to referrer when referred user completes registration
// @access  Private
router.post('/award-credits', [
  auth,
  body('referredUserId').isMongoId().withMessage('Valid user ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { referredUserId } = req.body;
    const referrerId = req.user._id;

    // Find the referred user
    const referredUser = await User.findById(referredUserId);
    if (!referredUser) {
      return res.status(404).json({ error: 'Referred user not found' });
    }

    // Check if the current user is actually the referrer
    if (referredUser.referredBy.toString() !== referrerId.toString()) {
      return res.status(403).json({ error: 'Not authorized to award credits for this referral' });
    }

    // Check if credits have already been awarded for this referral
    if (referredUser.referralStats.creditsEarned > 0) {
      return res.status(400).json({ error: 'Credits already awarded for this referral' });
    }

    // Award 10 credits to the referrer
    const referrer = await User.findById(referrerId);
    referrer.wallet.balance += 10;
    referrer.wallet.earned += 10;
    referrer.referralStats.successfulReferrals += 1;
    referrer.referralStats.creditsEarned += 10;

    // Mark the referred user as having earned credits
    referredUser.referralStats.creditsEarned = 10;

    await referrer.save();
    await referredUser.save();

    res.json({
      message: 'Credits awarded successfully',
      awardedCredits: 10,
      newBalance: referrer.wallet.balance
    });
  } catch (error) {
    console.error('Award credits error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/referrals/stats
// @desc    Get current user's referral statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('referralCode referralStats wallet');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      referralCode: user.referralCode,
      referralStats: user.referralStats,
      wallet: user.wallet
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 