const express = require('express');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats (placeholder)
// @access  Private/Admin
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    res.json({ message: 'Admin dashboard endpoint - to be implemented' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 