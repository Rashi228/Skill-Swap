const mongoose = require('mongoose');

const webinarSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  topic: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 15,
    max: 480 // 8 hours max
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 1,
    max: 1000,
    default: 50
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  meetingLink: {
    type: String,
    trim: true
  },
  hostMeetingLink: {
    type: String,
    trim: true
  },
  meetingId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  meetingPassword: {
    type: String,
    trim: true
  },
  recordingLink: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },
  approvedParticipants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  price: {
    type: Number,
    default: 0, // 0 = free
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR']
  }
}, {
  timestamps: true
});

// Index for efficient queries
webinarSchema.index({ host: 1, scheduledDate: 1 });
webinarSchema.index({ status: 1, scheduledDate: 1 });
webinarSchema.index({ topic: 1, isPublic: 1 });

// Virtual for checking if webinar is full
webinarSchema.virtual('isFull').get(function() {
  return this.currentParticipants >= this.maxParticipants;
});

// Virtual for checking if user can join
webinarSchema.virtual('canJoin').get(function() {
  return this.status === 'upcoming' && !this.isFull;
});

// Method to add participant
webinarSchema.methods.addParticipant = async function(userId) {
  if (this.isFull) {
    throw new Error('Webinar is full');
  }
  
  if (this.status !== 'upcoming') {
    throw new Error('Webinar is not accepting participants');
  }

  const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString());
  if (existingParticipant) {
    throw new Error('User is already registered for this webinar');
  }

  this.participants.push({ user: userId });
  this.currentParticipants += 1;
  return await this.save();
};

// Method to remove participant
webinarSchema.methods.removeParticipant = async function(userId) {
  const participantIndex = this.participants.findIndex(p => p.user.toString() === userId.toString());
  if (participantIndex === -1) {
    throw new Error('User is not registered for this webinar');
  }

  this.participants.splice(participantIndex, 1);
  this.currentParticipants = Math.max(0, this.currentParticipants - 1);
  return await this.save();
};

// Method to generate meeting details
webinarSchema.methods.generateMeetingDetails = function() {
  // Generate unique meeting ID for internal tracking
  const meetingId = `skillswap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate a more realistic Google Meet code (3 letters, 4 letters, 3 letters)
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const generateCode = () => {
    let code = '';
    for (let i = 0; i < 3; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    code += '-';
    for (let i = 0; i < 4; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    code += '-';
    for (let i = 0; i < 3; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return code;
  };
  
  const meetCode = generateCode();
  const googleMeetLink = `https://meet.google.com/${meetCode}`;
  
  this.meetingId = meetingId;
  this.meetingPassword = ''; // Google Meet doesn't use passwords in the same way
  this.meetingLink = googleMeetLink;
  this.hostMeetingLink = googleMeetLink; // Same link for host and participants in Google Meet
  
  return {
    meetingId,
    meetingPassword: '',
    meetingLink: googleMeetLink,
    hostMeetingLink: googleMeetLink
  };
};

module.exports = mongoose.model('Webinar', webinarSchema); 