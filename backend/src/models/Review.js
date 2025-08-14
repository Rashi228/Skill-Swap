const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  category: {
    type: String,
    enum: ['teaching', 'learning', 'communication', 'knowledge', 'helpfulness', 'professionalism', 'overall'],
    required: true
  },
  comment: {
    type: String,
    maxlength: 500,
    required: true
  },
  context: {
    type: String,
    enum: ['swap', 'skill', 'profile', 'community', 'chat'],
    required: true
  },
  swapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Swap',
    required: false // Only required for swap-based reviews
  },
  interactionType: {
    type: String,
    enum: ['swap_completed', 'chat_interaction', 'profile_view', 'skill_discussion', 'community_help'],
    required: true
  },
  interactionDate: {
    type: Date,
    required: true
  },
  helpfulCount: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
reviewSchema.index({ reviewed: 1, createdAt: -1 });
reviewSchema.index({ reviewer: 1, reviewed: 1 });
reviewSchema.index({ swapId: 1 });
reviewSchema.index({ category: 1, reviewed: 1 });

// Pre-save middleware to update updatedAt
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to check if user can review another user
reviewSchema.statics.canReview = async function(reviewerId, reviewedId, context = 'general') {
  try {
    // Cannot review yourself
    if (reviewerId.toString() === reviewedId.toString()) {
      return { canReview: false, reason: 'Cannot review yourself' };
    }

    // Check if already reviewed recently (within 30 days for same context)
    const recentReview = await this.findOne({
      reviewer: reviewerId,
      reviewed: reviewedId,
      context: context,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    if (recentReview) {
      return { canReview: false, reason: 'Already reviewed this user recently in this context' };
    }

    // Check minimum interaction requirements
    const hasInteraction = await this.checkInteraction(reviewerId, reviewedId, context);
    if (!hasInteraction.canReview) {
      return hasInteraction;
    }

    return { canReview: true, reason: 'Valid to review' };
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return { canReview: false, reason: 'Error checking eligibility' };
  }
};

// Static method to check interaction requirements
reviewSchema.statics.checkInteraction = async function(reviewerId, reviewedId, context) {
  try {
    const Swap = require('./Swap');
    const Chat = require('./Chat');

    switch (context) {
      case 'swap':
        // For swap reviews, check if swap was completed
        const swap = await Swap.findOne({
          $or: [
            { requester: reviewerId, recipient: reviewedId },
            { requester: reviewedId, recipient: reviewerId }
          ],
          status: 'completed',
          completedAt: { $exists: true }
        });
        
        if (!swap) {
          return { canReview: false, reason: 'No completed swap found between users' };
        }
        
        return { 
          canReview: true, 
          swapId: swap._id,
          interactionType: 'swap_completed',
          interactionDate: swap.completedAt
        };

      case 'chat':
        // For chat reviews, check if there was meaningful chat interaction
        const chatMessages = await Chat.countDocuments({
          $or: [
            { sender: reviewerId, recipient: reviewedId },
            { sender: reviewedId, recipient: reviewerId }
          ],
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        });
        
        if (chatMessages < 5) {
          return { canReview: false, reason: 'Insufficient chat interaction (minimum 5 messages in last 7 days)' };
        }
        
        return { 
          canReview: true, 
          interactionType: 'chat_interaction',
          interactionDate: new Date()
        };

      case 'skill':
        // For skill reviews, check if there was skill-related discussion
        const skillChats = await Chat.countDocuments({
          $or: [
            { sender: reviewerId, recipient: reviewedId },
            { sender: reviewedId, recipient: reviewerId }
          ],
          message: { $regex: /skill|teach|learn|help/i },
          createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } // Last 14 days
        });
        
        if (skillChats < 3) {
          return { canReview: false, reason: 'Insufficient skill-related interaction' };
        }
        
        return { 
          canReview: true, 
          interactionType: 'skill_discussion',
          interactionDate: new Date()
        };

      case 'community':
        // For community reviews, check if user has been active in community
        return { 
          canReview: true, 
          interactionType: 'community_help',
          interactionDate: new Date()
        };

      default:
        // For general reviews, require at least profile view and some interaction
        return { 
          canReview: true, 
          interactionType: 'profile_view',
          interactionDate: new Date()
        };
    }
  } catch (error) {
    console.error('Error checking interaction:', error);
    return { canReview: false, reason: 'Error checking interaction requirements' };
  }
};

// Instance method to mark review as helpful
reviewSchema.methods.markHelpful = async function(userId) {
  if (!this.helpfulCount.includes(userId)) {
    this.helpfulCount.push(userId);
    await this.save();
  }
  return this.helpfulCount.length;
};

// Instance method to unmark review as helpful
reviewSchema.methods.unmarkHelpful = async function(userId) {
  this.helpfulCount = this.helpfulCount.filter(id => id.toString() !== userId.toString());
  await this.save();
  return this.helpfulCount.length;
};

module.exports = mongoose.model('Review', reviewSchema); 