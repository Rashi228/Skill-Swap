const mongoose = require('mongoose');

// Define a dedicated sub-schema for file attachments to avoid any ambiguity
// with primitive string casting in certain Mongoose versions/environments.
const fileSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  size: { type: Number, default: 0 },
  type: { type: String, default: '' },
  url: { type: String, default: '' },
  thumbnail: { type: String, default: '' }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  // Conversation this message belongs to
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },

  // Sender
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Message type
  type: {
    type: String,
    enum: ['text', 'file', 'image', 'video', 'audio', 'system', 'call', 'meeting'],
    default: 'text'
  },

  // Message content
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },

  // File information (for file messages)
  file: fileSchema,

  // Message metadata
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },

  // Reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Replies
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },

  // Read receipts
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },

  // For system messages
  systemData: {
    action: String,
    data: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ type: 1 });
messageSchema.index({ 'readBy.user': 1 });

// Virtual for checking if message is readable
messageSchema.virtual('isReadable').get(function() {
  return !this.isDeleted;
});

// Method to mark as read
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(r => r.user.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    this.status = 'read';
    return this.save();
  }
  return this;
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  const existingReaction = this.reactions.find(r => 
    r.user.toString() === userId.toString() && r.emoji === emoji
  );
  
  if (existingReaction) {
    // Remove existing reaction
    this.reactions = this.reactions.filter(r => 
      !(r.user.toString() === userId.toString() && r.emoji === emoji)
    );
  } else {
    // Add new reaction
    this.reactions.push({
      user: userId,
      emoji,
      timestamp: new Date()
    });
  }

  return this.save();
};

// Method to edit message
messageSchema.methods.editMessage = function(newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

// Method to delete message
messageSchema.methods.deleteMessage = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to get reaction count by emoji
messageSchema.methods.getReactionCount = function(emoji) {
  return this.reactions.filter(r => r.emoji === emoji).length;
};

// Method to get all reactions grouped by emoji
messageSchema.methods.getReactionsSummary = function() {
  const summary = {};
  this.reactions.forEach(reaction => {
    if (!summary[reaction.emoji]) {
      summary[reaction.emoji] = [];
    }
    summary[reaction.emoji].push(reaction.user);
  });
  return summary;
};

// Static method to create system message
messageSchema.statics.createSystemMessage = function(conversationId, content, systemData = {}) {
  return this.create({
    conversation: conversationId,
    sender: null, // System messages don't have a sender
    type: 'system',
    content,
    systemData
  });
};

// Static method to create file message
messageSchema.statics.createFileMessage = function(conversationId, senderId, fileName, fileSize, fileType, fileUrl, thumbnailUrl = '') {
  return this.create({
    conversation: conversationId,
    sender: senderId,
    type: this.getFileType(fileType),
    content: `Sent ${fileName}`,
    file: {
      name: fileName,
      size: fileSize,
      type: fileType,
      url: fileUrl,
      thumbnail: thumbnailUrl
    }
  });
};

// Static method to determine file type
messageSchema.statics.getFileType = function(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
};

// Static method to create call message
messageSchema.statics.createCallMessage = function(conversationId, senderId, callType, duration = null) {
  const content = duration 
    ? `${callType} call ended (${duration} minutes)`
    : `${callType} call started`;

  return this.create({
    conversation: conversationId,
    sender: senderId,
    type: 'call',
    content,
    systemData: {
      action: 'call',
      callType,
      duration
    }
  });
};

// Static method to create meeting link message
messageSchema.statics.createMeetingMessage = function(conversationId, senderId, meetingUrl, meetingTitle) {
  return this.create({
    conversation: conversationId,
    sender: senderId,
    type: 'meeting',
    content: `Meeting: ${meetingTitle}`,
    systemData: {
      action: 'meeting',
      meetingUrl,
      meetingTitle
    }
  });
};

// Pre-save middleware to update conversation's last message
messageSchema.pre('save', async function(next) {
  if (this.isNew && !this.isDeleted) {
    try {
      const Conversation = require('./Conversation');
      await Conversation.findByIdAndUpdate(
        this.conversation,
        {
          lastMessage: {
            content: this.content,
            sender: this.sender,
            timestamp: new Date()
          },
          $inc: { messageCount: 1 }
        }
      );
    } catch (error) {
      console.error('Error updating conversation last message:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema); 