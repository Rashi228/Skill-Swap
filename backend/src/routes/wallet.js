const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const router = express.Router();

// @route   GET /api/wallet/balance
// @desc    Get wallet balance and summary
// @access  Private
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      balance: user.wallet.balance,
      earned: user.wallet.earned,
      spent: user.wallet.spent
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/wallet/transactions
// @desc    Get user's transaction history
// @access  Private
router.get('/transactions', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type; // 'earned' or 'spent'
    const search = req.query.search;

    const query = { userId: req.user._id };
    
    if (type) {
      query.type = type;
    }
    
    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('relatedUserId', 'firstName lastName username');

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions: transactions.map(tx => ({
        id: tx._id,
        date: tx.createdAt,
        type: tx.type === 'earned' ? 'Earned' : 'Spent',
        amount: tx.type === 'earned' ? tx.amount : -tx.amount,
        desc: tx.description,
        relatedUser: tx.relatedUserId ? `${tx.relatedUserId.firstName} ${tx.relatedUserId.lastName}` : null
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



// @route   POST /api/wallet/spend-credits
// @desc    Spend credits from wallet
// @access  Private
router.post('/spend-credits', [
  auth,
  body('amount').isFloat({ min: 0.1 }).withMessage('Amount must be positive'),
  body('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, description } = req.body;

    // Check if user has enough balance
    const user = await User.findById(req.user._id);
    if (user.wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create transaction
    const transaction = new Transaction({
      userId: req.user._id,
      type: 'spent',
      amount: amount,
      description: description
    });

    await transaction.save();

    // Update user wallet
    user.wallet.balance -= amount;
    user.wallet.spent += amount;
    await user.save();

    res.json({
      message: 'Credits spent successfully',
      newBalance: user.wallet.balance,
      transaction: {
        id: transaction._id,
        date: transaction.createdAt,
        type: 'Spent',
        amount: -amount,
        desc: description
      }
    });
  } catch (error) {
    console.error('Spend credits error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/wallet/transfer
// @desc    Transfer credits between users (for skill swaps)
// @access  Private
router.post('/transfer', [
  auth,
  body('toUserId').isMongoId().withMessage('Valid user ID required'),
  body('amount').isFloat({ min: 0.1 }).withMessage('Amount must be positive'),
  body('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { toUserId, amount, description } = req.body;

    // Check if user has enough balance
    const fromUser = await User.findById(req.user._id);
    if (fromUser.wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Check if recipient exists
    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Create transactions for both users
    const fromTransaction = new Transaction({
      userId: req.user._id,
      type: 'spent',
      amount: amount,
      description: description,
      relatedUserId: toUserId
    });

    const toTransaction = new Transaction({
      userId: toUserId,
      type: 'earned',
      amount: amount,
      description: `Received: ${description}`,
      relatedUserId: req.user._id
    });

    await fromTransaction.save();
    await toTransaction.save();

    // Update both users' wallets
    fromUser.wallet.balance -= amount;
    fromUser.wallet.spent += amount;
    toUser.wallet.balance += amount;
    toUser.wallet.earned += amount;

    await fromUser.save();
    await toUser.save();

    // Check for achievements for the recipient
    const newAchievements = [];
    const currentBadges = toUser.achievements.badges.map(badge => badge.name);

    // Check for credit-based achievements
    if (toUser.wallet.earned >= 100 && !currentBadges.includes('Credit Collector')) {
      newAchievements.push({
        name: 'Credit Collector',
        description: 'Earned 100+ credits',
        icon: '💰',
        category: 'credits'
      });
    }

    if (toUser.wallet.earned >= 500 && !currentBadges.includes('Credit Master')) {
      newAchievements.push({
        name: 'Credit Master',
        description: 'Earned 500+ credits',
        icon: '💎',
        category: 'credits'
      });
    }

    // Add new achievements
    if (newAchievements.length > 0) {
      toUser.achievements.badges.push(...newAchievements);
      toUser.achievements.totalBadges = toUser.achievements.badges.length;
      
      // Recalculate experience and level
      toUser.achievements.experience = toUser.achievements.totalBadges * 10 + toUser.rating.count * 5 + Math.floor(toUser.wallet.earned / 10);
      toUser.achievements.level = Math.floor(toUser.achievements.experience / 100) + 1;
      
      await toUser.save();
    }

    res.json({
      message: 'Transfer completed successfully',
      newBalance: fromUser.wallet.balance,
      newAchievements: newAchievements.length > 0 ? newAchievements : null
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 