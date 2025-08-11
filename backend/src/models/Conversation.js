const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // Conversation type
  type: {
    type: String,
    enum: ['direct', 'swap', 'group'],
    required: true
  },

  // Participants
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['creator', 'participant', 'admin'],
      default: 'participant'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastRead: {
      type: Date,
      default: Date.now
    }
  }],

  // For swap-related conversations
  swapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Swap'
  },

  // Conversation metadata
  title: {
    type: String,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  avatar: {
    type: String,
    default: ''
  },

  // Settings
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  allowFileSharing: {
    type: Boolean,
    default: true
  },
  allowVideoCalls: {
    type: Boolean,
    default: true
  },

  // Last activity
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },

  // Message count
  messageCount: {
    type: Number,
    default: 0
  },

  // Pinned messages
  pinnedMessages: [{
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pinnedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ swapId: 1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ 'lastMessage.timestamp': -1 });

// Virtual for checking if conversation is active
conversationSchema.virtual('isActiveConversation').get(function() {
  return this.isActive && this.participants.some(p => p.isActive);
});

// Method to add participant
conversationSchema.methods.addParticipant = function(userId, role = 'participant') {
  const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString());
  if (existingParticipant) {
    throw new Error('User is already a participant');
  }

  this.participants.push({
    user: userId,
    role,
    joinedAt: new Date(),
    isActive: true,
    lastRead: new Date()
  });

  return this.save();
};

// Method to remove participant
conversationSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (!participant) {
    throw new Error('User is not a participant');
  }

  participant.isActive = false;
  return this.save();
};

// Method to update last read
conversationSchema.methods.updateLastRead = function(userId) {
  const userIdStr = userId.toString();
  const participant = this.participants.find(p => {
    const participantId = (p.user && p.user._id) ? p.user._id.toString() : p.user.toString();
    return participantId === userIdStr;
  });
  if (participant) {
    participant.lastRead = new Date();
    return this.save();
  }
  throw new Error('User is not a participant');
};

// Method to update last message
conversationSchema.methods.updateLastMessage = function(content, senderId) {
  this.lastMessage = {
    content,
    sender: senderId,
    timestamp: new Date()
  };
  this.messageCount += 1;
  return this.save();
};

// Method to pin a message
conversationSchema.methods.pinMessage = function(messageId, userId) {
  const existingPin = this.pinnedMessages.find(p => p.messageId.toString() === messageId.toString());
  if (existingPin) {
    throw new Error('Message is already pinned');
  }

  this.pinnedMessages.push({
    messageId,
    pinnedBy: userId,
    pinnedAt: new Date()
  });

  return this.save();
};

// Method to unpin a message
conversationSchema.methods.unpinMessage = function(messageId) {
  this.pinnedMessages = this.pinnedMessages.filter(p => p.messageId.toString() !== messageId.toString());
  return this.save();
};

// Static method to create direct conversation
conversationSchema.statics.createDirectConversation = function(user1Id, user2Id) {
  return this.create({
    type: 'direct',
    participants: [
      { user: user1Id, role: 'participant' },
      { user: user2Id, role: 'participant' }
    ]
  });
};

// Static method to create swap conversation
conversationSchema.statics.createSwapConversation = function(swapId, participants) {
  return this.create({
    type: 'swap',
    swapId,
    participants: participants.map(p => ({
      user: p.user,
      role: p.role || 'participant'
    })),
    title: `Swap Chat`,
    allowFileSharing: true,
    allowVideoCalls: true
  });
};

// Static method to create group conversation
conversationSchema.statics.createGroupConversation = function(creatorId, title, description = '') {
  return this.create({
    type: 'group',
    participants: [
      { user: creatorId, role: 'creator' }
    ],
    title,
    description,
    allowFileSharing: true,
    allowVideoCalls: true
  });
};

module.exports = mongoose.model('Conversation', conversationSchema); 