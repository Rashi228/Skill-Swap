const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Socket.io instance (will be set by server.js)
let io = null;
const setIO = (socketIO) => {
  io = socketIO;
};

// @route   GET /api/wallet/balance
// @desc    Get user's wallet balance
// @access  Private
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      balance: user.wallet.balance || 0,
      earned: user.wallet.earned || 0,
      spent: user.wallet.spent || 0
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/wallet/transactions
// @desc    Get user's wallet transactions with pagination and filtering
// @access  Private
router.get('/transactions', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const type = req.query.type || '';

    // Ensure wallet.transactions exists
    if (!user.wallet.transactions) {
      user.wallet.transactions = [];
      await user.save();
    }
    
    let transactions = user.wallet.transactions;

    // Filter by type if specified
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }

    // Filter by search term if specified
    if (search) {
      transactions = transactions.filter(t => 
        t.reason && t.reason.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort by timestamp (newest first)
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Calculate pagination
    const total = transactions.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    res.json({
      transactions: paginatedTransactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/wallet/add-credits
// @desc    Add credits to user's wallet (for testing/achievements)
// @access  Private
router.post('/add-credits', auth, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add credits
    user.wallet.balance += amount;
    user.wallet.earned += amount;
    
    // Add transaction
    const transaction = {
      type: 'credit',
      amount: amount,
      reason: reason || 'Credit added',
      timestamp: new Date()
    };
    
    user.wallet.transactions.push(transaction);
    await user.save();

    // Emit socket event for wallet update
    if (io) {
      io.to(`user_${user._id}`).emit('wallet_balance_updated', {
        balance: user.wallet.balance,
        earned: user.wallet.earned,
        spent: user.wallet.spent,
        transactions: user.wallet.transactions
      });
    }

    res.json({
      message: 'Credits added successfully',
      newBalance: user.wallet.balance,
      transaction
    });
  } catch (error) {
    console.error('Add credits error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/wallet/spend-credits
// @desc    Spend credits from user's wallet
// @access  Private
router.post('/spend-credits', auth, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Spend credits
    user.wallet.balance -= amount;
    user.wallet.spent += amount;
    
    // Add transaction
    const transaction = {
      type: 'debit',
      amount: amount,
      reason: reason || 'Credits spent',
      timestamp: new Date()
    };
    
    user.wallet.transactions.push(transaction);
    await user.save();

    // Emit socket event for wallet update
    if (io) {
      io.to(`user_${user._id}`).emit('wallet_balance_updated', {
        balance: user.wallet.balance,
        earned: user.wallet.earned,
        spent: user.wallet.spent,
        transactions: user.wallet.transactions
      });
    }

    res.json({
      message: 'Credits spent successfully',
      newBalance: user.wallet.balance,
      transaction
    });
  } catch (error) {
    console.error('Spend credits error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



module.exports = { router, setIO }; 