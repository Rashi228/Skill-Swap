const User = require('../models/User');

class AchievementService {
  // Define achievement badges
  static achievements = {
    // Credit-based achievements
    FIRST_CREDIT: {
      name: 'First Credit',
      description: 'Earned your first credit',
      icon: '💰',
      category: 'credits',
      condition: (user) => user.wallet.earned >= 1
    },
    CREDIT_COLLECTOR: {
      name: 'Credit Collector',
      description: 'Earned 10 credits',
      icon: '💎',
      category: 'credits',
      condition: (user) => user.wallet.earned >= 10
    },
    CREDIT_MASTER: {
      name: 'Credit Master',
      description: 'Earned 50 credits',
      icon: '👑',
      category: 'credits',
      condition: (user) => user.wallet.earned >= 50
    },
    CREDIT_LEGEND: {
      name: 'Credit Legend',
      description: 'Earned 100 credits',
      icon: '🏆',
      category: 'credits',
      condition: (user) => user.wallet.earned >= 100
    },

    // Skill-based achievements
    FIRST_SKILL: {
      name: 'Skill Starter',
      description: 'Added your first skill',
      icon: '🎯',
      category: 'skill',
      condition: (user) => user.skills.length >= 1
    },
    SKILL_DEVELOPER: {
      name: 'Skill Developer',
      description: 'Added 5 skills',
      icon: '🔧',
      category: 'skill',
      condition: (user) => user.skills.length >= 5
    },
    SKILL_MASTER: {
      name: 'Skill Master',
      description: 'Added 10 skills',
      icon: '⚡',
      category: 'skill',
      condition: (user) => user.skills.length >= 10
    },

    // Reputation-based achievements
    FIRST_REVIEW: {
      name: 'First Impression',
      description: 'Received your first review',
      icon: '⭐',
      category: 'reputation',
      condition: (user) => user.rating?.count >= 1
    },
    REVIEWED_WELL: {
      name: 'Well Reviewed',
      description: 'Received 5 reviews',
      icon: '🌟',
      category: 'reputation',
      condition: (user) => user.rating?.count >= 5
    },
    HIGH_RATED: {
      name: 'Highly Rated',
      description: 'Achieved 4.5+ average rating',
      icon: '🏅',
      category: 'reputation',
      condition: (user) => user.rating?.average >= 4.5 && user.rating?.count >= 3
    },

    // Swap-based achievements
    FIRST_SWAP: {
      name: 'First Swap',
      description: 'Completed your first skill swap',
      icon: '🤝',
      category: 'swaps',
      condition: (user) => user.completedSwaps >= 1
    },
    SWAP_PARTNER: {
      name: 'Swap Partner',
      description: 'Completed 5 swaps',
      icon: '👥',
      category: 'swaps',
      condition: (user) => user.completedSwaps >= 5
    },
    SWAP_EXPERT: {
      name: 'Swap Expert',
      description: 'Completed 10 swaps',
      icon: '🎓',
      category: 'swaps',
      condition: (user) => user.completedSwaps >= 10
    },

    // Social achievements
    PROFILE_COMPLETE: {
      name: 'Profile Complete',
      description: 'Completed your profile',
      icon: '📝',
      category: 'social',
      condition: (user) => user.firstName && user.lastName && user.bio && user.location
    },
    DAILY_LOGIN: {
      name: 'Daily Login',
      description: 'Logged in for 7 consecutive days',
      icon: '📅',
      category: 'social',
      condition: (user) => user.consecutiveLogins >= 7
    }
  };

  // Check and award achievements for a user
  static async checkAndAwardAchievements(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return { success: false, error: 'User not found' };

      const newAchievements = [];
      const currentBadges = user.achievements?.badges || [];

      // Check each achievement
      for (const [achievementKey, achievement] of Object.entries(this.achievements)) {
        // Check if user already has this achievement
        const alreadyHasAchievement = currentBadges.some(badge => badge.name === achievement.name);
        
        if (!alreadyHasAchievement && achievement.condition(user)) {
          // Award the achievement
          const newBadge = {
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            earnedAt: new Date(),
            category: achievement.category
          };

          newAchievements.push(newBadge);
        }
      }

      // Update user achievements if there are new ones
      if (newAchievements.length > 0) {
        if (!user.achievements) {
          user.achievements = {
            badges: [],
            totalBadges: 0,
            level: 1,
            experience: 0
          };
        }

        user.achievements.badges.push(...newAchievements);
        user.achievements.totalBadges = user.achievements.badges.length;
        
        // Calculate level based on total badges
        user.achievements.level = Math.floor(user.achievements.totalBadges / 3) + 1;
        user.achievements.experience = user.achievements.totalBadges * 10;

        await user.save();
      }

      return {
        success: true,
        newAchievements,
        totalBadges: user.achievements?.totalBadges || 0,
        level: user.achievements?.level || 1,
        experience: user.achievements?.experience || 0
      };

    } catch (error) {
      console.error('Achievement check error:', error);
      return { success: false, error: 'Failed to check achievements' };
    }
  }

  // Award specific achievement
  static async awardAchievement(userId, achievementKey) {
    try {
      const user = await User.findById(userId);
      if (!user) return { success: false, error: 'User not found' };

      const achievement = this.achievements[achievementKey];
      if (!achievement) return { success: false, error: 'Achievement not found' };

      // Check if user already has this achievement
      const currentBadges = user.achievements?.badges || [];
      const alreadyHasAchievement = currentBadges.some(badge => badge.name === achievement.name);
      
      if (alreadyHasAchievement) {
        return { success: false, message: 'Achievement already earned' };
      }

      // Award the achievement
      const newBadge = {
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        earnedAt: new Date(),
        category: achievement.category
      };

      if (!user.achievements) {
        user.achievements = {
          badges: [],
          totalBadges: 0,
          level: 1,
          experience: 0
        };
      }

      user.achievements.badges.push(newBadge);
      user.achievements.totalBadges = user.achievements.badges.length;
      user.achievements.level = Math.floor(user.achievements.totalBadges / 3) + 1;
      user.achievements.experience = user.achievements.totalBadges * 10;

      await user.save();

      return {
        success: true,
        newAchievement: newBadge,
        totalBadges: user.achievements.totalBadges,
        level: user.achievements.level,
        experience: user.achievements.experience
      };

    } catch (error) {
      console.error('Achievement award error:', error);
      return { success: false, error: 'Failed to award achievement' };
    }
  }

  // Get user's current achievements
  static async getUserAchievements(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return { success: false, error: 'User not found' };

      return {
        success: true,
        achievements: user.achievements || {
          badges: [],
          totalBadges: 0,
          level: 1,
          experience: 0
        }
      };

    } catch (error) {
      console.error('Get achievements error:', error);
      return { success: false, error: 'Failed to get achievements' };
    }
  }
}

module.exports = AchievementService; 