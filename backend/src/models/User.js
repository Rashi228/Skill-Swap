const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  age: {
    type: Number,
    min: 13,
    max: 120,
    default: null
  },
  language: {
    type: String,
    default: ''
  },
  links: [{
    label: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    }
  }],
  skills: [{
    name: {
      type: String,
      required: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    },
    description: String,
    tags: [String]
  }],
  skillsToLearn: [{
    name: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    description: String
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    helpfulReviews: {
      type: Number,
      default: 0
    },
    reviewBreakdown: {
      teaching: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      learning: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      communication: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      knowledge: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      helpfulness: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      professionalism: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      overall: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } }
    }
  },
  wallet: {
    balance: {
      type: Number,
      default: 0
    },
    earned: {
      type: Number,
      default: 0
    },
    spent: {
      type: Number,
      default: 0
    },
    transactions: [{
      type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      reason: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  achievements: {
    badges: [{
      name: {
        type: String,
        required: true
      },
      description: String,
      icon: String,
      earnedAt: {
        type: Date,
        default: Date.now
      },
      category: {
        type: String,
        enum: ['skill', 'reputation', 'credits', 'swaps', 'social'],
        default: 'skill'
      }
    }],
    totalBadges: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    },
    experience: {
      type: Number,
      default: 0
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  lastLoginDate: {
    type: Date,
    default: null
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
      showEmail: { type: Boolean, default: false },
      showLocation: { type: Boolean, default: true }
    }
  },
  // Referral system fields
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referralStats: {
    totalReferrals: {
      type: Number,
      default: 0
    },
    successfulReferrals: {
      type: Number,
      default: 0
    },
    creditsEarned: {
      type: Number,
      default: 0
    }
  },
  // Password reset fields
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate referral code before saving
userSchema.pre('save', async function(next) {
  if (this.isNew && !this.referralCode) {
    try {
      let referralCode;
      let isUnique = false;
      
      // Generate a unique referral code
      while (!isUnique) {
        referralCode = this.username.toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase();
        const existingUser = await mongoose.model('User').findOne({ referralCode });
        if (!existingUser) {
          isUnique = true;
        }
      }
      
      this.referralCode = referralCode;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema); 