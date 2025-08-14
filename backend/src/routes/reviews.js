const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Review = require('../models/Review');
const User = require('../models/User');
const Swap = require('../models/Swap');
const NotificationService = require('../utils/notificationService');

const router = express.Router();

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', [
  auth,
  body('reviewedId').isMongoId().withMessage('Valid user ID required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('category').isIn(['teaching', 'learning', 'communication', 'knowledge', 'helpfulness', 'professionalism', 'overall']).withMessage('Valid category required'),
  body('comment').isLength({ min: 10, max: 500 }).withMessage('Comment must be between 10 and 500 characters'),
  body('context').isIn(['swap', 'skill', 'profile', 'community', 'chat']).withMessage('Valid context required'),
  body('swapId').optional().isMongoId().withMessage('Valid swap ID required if context is swap')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reviewedId, rating, category, comment, context, swapId } = req.body;
    const reviewerId = req.user._id;

    // Check if user can review
    const canReview = await Review.canReview(reviewerId, reviewedId, context);
    if (!canReview.canReview) {
      return res.status(400).json({ error: canReview.reason });
    }

    // Create review
    const reviewData = {
      reviewer: reviewerId,
      reviewed: reviewedId,
      rating,
      category,
      comment,
      context
    };

    // Set interaction details based on context
    if (context === 'swap' && swapId) {
      reviewData.swapId = swapId;
      reviewData.interactionType = 'swap_completed';
      reviewData.interactionDate = new Date();
    } else if (canReview.interactionType && canReview.interactionDate) {
      reviewData.interactionType = canReview.interactionType;
      reviewData.interactionDate = canReview.interactionDate;
    } else {
      // Default values for other contexts
      reviewData.interactionType = 'profile_view';
      reviewData.interactionDate = new Date();
    }

    const review = new Review(reviewData);
    await review.save();

    console.log('Review saved successfully:', review._id);

    // Update user's rating statistics
    console.log('Calling updateUserRatingStats for user:', reviewedId);
    await updateUserRatingStats(reviewedId);
    console.log('updateUserRatingStats completed');

    // Create notification for reviewed user
    try {
      await NotificationService.createReviewNotification(
        reviewedId,
        reviewerId,
        rating,
        category
      );
    } catch (error) {
      console.error('Error creating review notification:', error);
    }

    // Populate reviewer details for response
    await review.populate('reviewer', 'firstName lastName username profilePicture');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });

  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/reviews/user/:userId
// @desc    Get reviews for a specific user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, category, sort = 'recent' } = req.query;

    // Validate userId
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }

    const query = { reviewed: userId, isActive: true };
    if (category) {
      query.category = category;
    }

    let sortOption = {};
    switch (sort) {
      case 'recent':
        sortOption = { createdAt: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'helpful':
        sortOption = { helpfulCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const reviews = await Review.find(query)
      .populate('reviewer', 'firstName lastName username profilePicture')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Review.countDocuments(query);

    res.json({
      success: true,
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/reviews/my-reviews
// @desc    Get reviews given by current user
// @access  Private
router.get('/my-reviews', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ reviewer: req.user._id, isActive: true })
      .populate('reviewed', 'firstName lastName username profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Review.countDocuments({ reviewer: req.user._id, isActive: true });

    res.json({
      success: true,
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/reviews/can-review/:userId
// @desc    Check if current user can review another user
// @access  Private
router.get('/can-review/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { context = 'general' } = req.query;

    const canReview = await Review.canReview(req.user._id, userId, context);

    res.json({
      success: true,
      canReview: canReview.canReview,
      reason: canReview.reason,
      interactionType: canReview.interactionType
    });

  } catch (error) {
    console.error('Check can review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/reviews/stats/:userId
// @desc    Get review statistics for a user
// @access  Public
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }

    const user = await User.findById(userId).select('rating');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get category breakdown
    const categoryStats = await Review.aggregate([
      { $match: { reviewed: user._id, isActive: true } },
      {
        $group: {
          _id: '$category',
          average: { $avg: '$rating' },
          count: { $sum: 1 },
          totalRating: { $sum: '$rating' }
        }
      }
    ]);

    // Get recent reviews count
    const recentReviews = await Review.countDocuments({
      reviewed: userId,
      isActive: true,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      stats: {
        overall: {
          average: user.rating.average,
          count: user.rating.count,
          totalReviews: user.rating.totalReviews,
          helpfulReviews: user.rating.helpfulReviews
        },
        categories: categoryStats,
        recentReviews
      }
    });

  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to update user rating statistics
async function updateUserRatingStats(userId) {
  try {
    console.log('Updating rating stats for user:', userId);
    const reviews = await Review.find({ reviewed: userId, isActive: true });
    console.log('Found reviews:', reviews.length);
    
    if (reviews.length === 0) {
      console.log('No reviews found, setting default values');
      await User.findByIdAndUpdate(userId, {
        'rating.average': 0,
        'rating.count': 0,
        'rating.totalReviews': 0,
        'rating.helpfulReviews': 0
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    const helpfulReviews = reviews.reduce((sum, review) => sum + review.helpfulCount, 0);

    console.log('Calculated stats:', { totalRating, averageRating, helpfulReviews });

    // Calculate category breakdown
    const categoryBreakdown = {};
    const categories = ['teaching', 'learning', 'communication', 'knowledge', 'helpfulness', 'professionalism', 'overall'];
    
    categories.forEach(category => {
      const categoryReviews = reviews.filter(review => review.category === category);
      if (categoryReviews.length > 0) {
        const categoryTotal = categoryReviews.reduce((sum, review) => sum + review.rating, 0);
        categoryBreakdown[category] = {
          average: categoryTotal / categoryReviews.length,
          count: categoryReviews.length
        };
      } else {
        categoryBreakdown[category] = { average: 0, count: 0 };
      }
    });

    const updateData = {
      'rating.average': Math.round(averageRating * 10) / 10, // Round to 1 decimal
      'rating.count': reviews.length,
      'rating.totalReviews': reviews.length,
      'rating.helpfulReviews': helpfulReviews,
      'rating.reviewBreakdown': categoryBreakdown
    };

    console.log('Updating user with data:', updateData);
    const result = await User.findByIdAndUpdate(userId, updateData);
    console.log('Update result:', result ? 'Success' : 'Failed');

  } catch (error) {
    console.error('Error updating user rating stats:', error);
  }
}

module.exports = router; 