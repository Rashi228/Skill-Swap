const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const NotificationService = require('../utils/notificationService');
const CreditService = require('../services/creditService');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required'),
  body('referralCode')
    .optional()
    .isString()
    .withMessage('Referral code must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, firstName, lastName, referralCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User with this email or username already exists'
      });
    }

    // Validate referral code if provided
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (!referrer) {
        return res.status(400).json({
          error: 'Invalid referral code'
        });
      }
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      referredBy: referrer ? referrer._id : null
    });

    await user.save();

    // Update referrer's stats and award credits if referral code was used
    if (referrer) {
      referrer.referralStats.totalReferrals += 1;
      referrer.referralStats.successfulReferrals += 1;
      referrer.referralStats.creditsEarned += 10;
      referrer.wallet.balance += 10;
      referrer.wallet.earned += 10;
      await referrer.save();

      // Create notification for the referrer
      try {
        await NotificationService.createRewardNotification(
          referrer._id,
          10,
          `You earned 10 credits for referring ${user.firstName} ${user.lastName}!`
        );
      } catch (error) {
        console.error('Error creating referral notification:', error);
        // Don't fail the registration if notification fails
      }
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        referredBy: referrer ? referrer._id : null
      },
      referrer: referrer ? {
        id: referrer._id,
        username: referrer.username,
        firstName: referrer.firstName,
        lastName: referrer.lastName
      } : null,
      referralCreditsAwarded: referrer ? 10 : 0
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(400).json({ error: 'Account is deactivated' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Award daily login credit
    const dailyCreditResult = await CreditService.awardDailyLoginCredit(user._id);
    
    // Check for profile completion credit
    const profileCreditResult = await CreditService.awardProfileCompletionCredit(user._id);

    // Update last active
    user.lastActive = new Date();
    await user.save();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
      },
            creditsAwarded: {
        daily: dailyCreditResult.success ? 1 : 0,
        profile: profileCreditResult.success ? 5 : 0
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    // Update last active
    req.user.lastActive = new Date();
    await req.user.save();

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 