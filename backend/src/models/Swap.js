const mongoose = require('mongoose');

const swapSchema = new mongoose.Schema({
  // Users involved in the swap
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Skills being swapped
  requesterSkill: {
    name: {
      type: String,
      required: true
    },
    description: String
  },
  recipientSkill: {
    name: {
      type: String,
      required: true
    },
    description: String
  },
  
  // Swap details
  message: {
    type: String,
    maxlength: 500
  },
  
  // Status: pending, accepted, rejected, completed, cancelled
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Timestamps for different stages
  requestedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  
  // Session details (when accepted)
  sessions: [{
    date: {
      type: Date,
      required: true
    },
    duration: {
      type: Number, // in minutes
      required: true
    },
    type: {
      type: String,
      enum: ['requester_teaching', 'recipient_teaching'],
      required: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    notes: String
  }],
  
  // Scheduled date for the swap (for calendar integration)
  scheduledDate: {
    type: Date
  },
  
  // Event details for calendar
  eventDetails: {
    title: String,
    description: String,
    startTime: String,
    endTime: String
  },
  
  // Ratings and reviews
  requesterRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    createdAt: Date
  },
  recipientRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    createdAt: Date
  }
}, {
  timestamps: true
});

// Indexes for faster queries
swapSchema.index({ requester: 1, status: 1 });
swapSchema.index({ recipient: 1, status: 1 });
swapSchema.index({ status: 1, requestedAt: -1 });

// Virtual for total sessions
swapSchema.virtual('totalSessions').get(function() {
  return this.sessions.length;
});

// Virtual for completed sessions
swapSchema.virtual('completedSessions').get(function() {
  return this.sessions.filter(session => session.status === 'completed').length;
});

// Method to check if swap is active
swapSchema.methods.isActive = function() {
  return ['pending', 'accepted'].includes(this.status);
};

// Method to check if user can rate
swapSchema.methods.canRate = function(userId) {
  if (this.status !== 'completed') return false;
  
  if (this.requester.toString() === userId.toString()) {
    return !this.requesterRating.rating;
  }
  
  if (this.recipient.toString() === userId.toString()) {
    return !this.recipientRating.rating;
  }
  
  return false;
};

module.exports = mongoose.model('Swap', swapSchema); 