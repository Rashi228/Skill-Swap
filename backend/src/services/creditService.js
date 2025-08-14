const User = require('../models/User');
const AchievementService = require('./achievementService');

class CreditService {
  // Daily login credit (once per day)
  static async awardDailyLoginCredit(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return { success: false, error: 'User not found' };

      const today = new Date().toDateString();
      const lastLoginDate = user.lastLoginDate ? new Date(user.lastLoginDate).toDateString() : null;

      // Check if user already got credit today
      if (lastLoginDate === today) {
        return { success: false, message: 'Already awarded daily credit today' };
      }

      // Award 1 credit for daily login
      user.wallet.balance += 1;
      user.wallet.earned += 1;
      user.lastLoginDate = new Date();

      // Add transaction
      const transaction = {
        type: 'credit',
        amount: 1,
        reason: 'Daily login bonus',
        timestamp: new Date()
      };
      user.wallet.transactions.push(transaction);

      await user.save();

      // Check for achievements after awarding credit
      const achievementResult = await AchievementService.checkAndAwardAchievements(userId);

      return { 
        success: true, 
        message: 'Daily login credit awarded',
        newBalance: user.wallet.balance,
        earned: user.wallet.earned,
        spent: user.wallet.spent,
        transaction,
        newAchievements: achievementResult.newAchievements || []
      };
    } catch (error) {
      console.error('Daily login credit error:', error);
      return { success: false, error: 'Failed to award daily credit' };
    }
  }

  // Profile completion credit (one-time)
  static async awardProfileCompletionCredit(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return { success: false, error: 'User not found' };

      // Check if profile is complete (has required fields)
      const isProfileComplete = user.firstName && user.lastName && user.bio && user.location;
      
      if (!isProfileComplete) {
        return { success: false, message: 'Profile not complete' };
      }

      // Check if already awarded
      const hasProfileCredit = user.wallet.transactions.some(t => 
        t.reason === 'Profile completion bonus'
      );

      if (hasProfileCredit) {
        return { success: false, message: 'Profile completion credit already awarded' };
      }

      // Award 5 credits for profile completion
      user.wallet.balance += 5;
      user.wallet.earned += 5;

      // Add transaction
      const transaction = {
        type: 'credit',
        amount: 5,
        reason: 'Profile completion bonus',
        timestamp: new Date()
      };
      user.wallet.transactions.push(transaction);

      await user.save();

      // Check for achievements after awarding credit
      const achievementResult = await AchievementService.checkAndAwardAchievements(userId);

      return { 
        success: true, 
        message: 'Profile completion credit awarded',
        newBalance: user.wallet.balance,
        earned: user.wallet.earned,
        spent: user.wallet.spent,
        transaction,
        newAchievements: achievementResult.newAchievements || []
      };
    } catch (error) {
      console.error('Profile completion credit error:', error);
      return { success: false, error: 'Failed to award profile completion credit' };
    }
  }

  // Skill addition credit (2 credits per skill, max 10 skills)
  static async awardSkillCredit(userId, skillName) {
    try {
      const user = await User.findById(userId);
      if (!user) return { success: false, error: 'User not found' };

      // Check if skill already exists
      const skillExists = user.skills.some(skill => skill.name === skillName);
      if (skillExists) {
        return { success: false, message: 'Skill already exists' };
      }

      // Check if already awarded for this skill
      const hasSkillCredit = user.wallet.transactions.some(t => 
        t.reason === `Skill added: ${skillName}`
      );

      if (hasSkillCredit) {
        return { success: false, message: 'Skill credit already awarded' };
      }

      // Award 2 credits for adding skill
      user.wallet.balance += 2;
      user.wallet.earned += 2;

      // Add transaction
      const transaction = {
        type: 'credit',
        amount: 2,
        reason: `Skill added: ${skillName}`,
        timestamp: new Date()
      };
      user.wallet.transactions.push(transaction);

      await user.save();

      // Check for achievements after awarding credit
      const achievementResult = await AchievementService.checkAndAwardAchievements(userId);

      return { 
        success: true, 
        message: 'Skill credit awarded',
        newBalance: user.wallet.balance,
        earned: user.wallet.earned,
        spent: user.wallet.spent,
        transaction,
        newAchievements: achievementResult.newAchievements || []
      };
    } catch (error) {
      console.error('Skill credit error:', error);
      return { success: false, error: 'Failed to award skill credit' };
    }
  }

  // First swap completion bonus (one-time)
  static async awardFirstSwapCredit(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return { success: false, error: 'User not found' };

      // Check if already awarded first swap credit
      const hasFirstSwapCredit = user.wallet.transactions.some(t => 
        t.reason === 'First swap completion bonus'
      );

      if (hasFirstSwapCredit) {
        return { success: false, message: 'First swap credit already awarded' };
      }

      // Award 10 credits for first swap
      user.wallet.balance += 10;
      user.wallet.earned += 10;

      // Add transaction
      const transaction = {
        type: 'credit',
        amount: 10,
        reason: 'First swap completion bonus',
        timestamp: new Date()
      };
      user.wallet.transactions.push(transaction);

      await user.save();

      // Check for achievements after awarding credit
      const achievementResult = await AchievementService.checkAndAwardAchievements(userId);

      return { 
        success: true, 
        message: 'First swap completion credit awarded',
        newBalance: user.wallet.balance,
        earned: user.wallet.earned,
        spent: user.wallet.spent,
        transaction,
        newAchievements: achievementResult.newAchievements || []
      };
    } catch (error) {
      console.error('First swap credit error:', error);
      return { success: false, error: 'Failed to award first swap credit' };
    }
  }

  // Regular swap completion credit
  static async awardSwapCompletionCredit(userId, swapType = 'teacher') {
    try {
      const user = await User.findById(userId);
      if (!user) return { success: false, error: 'User not found' };

      // Award credits based on role
      const credits = swapType === 'teacher' ? 5 : 2;
      const roleText = swapType === 'teacher' ? 'teaching' : 'learning';

      user.wallet.balance += credits;
      user.wallet.earned += credits;

      // Add transaction
      const transaction = {
        type: 'credit',
        amount: credits,
        reason: `Swap completion (${roleText})`,
        timestamp: new Date()
      };
      user.wallet.transactions.push(transaction);

      await user.save();

      // Check for achievements after awarding credit
      const achievementResult = await AchievementService.checkAndAwardAchievements(userId);

      return { 
        success: true, 
        message: `Swap completion credit awarded (${roleText})`,
        newBalance: user.wallet.balance,
        earned: user.wallet.earned,
        spent: user.wallet.spent,
        transaction,
        newAchievements: achievementResult.newAchievements || []
      };
    } catch (error) {
      console.error('Swap completion credit error:', error);
      return { success: false, error: 'Failed to award swap completion credit' };
    }
  }

  // High rating bonus (4.5+ rating)
  static async awardHighRatingCredit(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return { success: false, error: 'User not found' };

      // Check if rating is high enough
      if (user.rating.average < 4.5 || user.rating.count < 1) {
        return { success: false, message: 'Rating not high enough for bonus' };
      }

      // Check if already awarded high rating credit
      const hasHighRatingCredit = user.wallet.transactions.some(t => 
        t.reason === 'High rating bonus (4.5+)'
      );

      if (hasHighRatingCredit) {
        return { success: false, message: 'High rating credit already awarded' };
      }

      // Award 20 credits for high rating
      user.wallet.balance += 20;
      user.wallet.earned += 20;

      // Add transaction
      const transaction = {
        type: 'credit',
        amount: 20,
        reason: 'High rating bonus (4.5+)',
        timestamp: new Date()
      };
      user.wallet.transactions.push(transaction);

      await user.save();

      // Check for achievements after awarding credit
      const achievementResult = await AchievementService.checkAndAwardAchievements(userId);

      return { 
        success: true, 
        message: 'High rating credit awarded',
        newBalance: user.wallet.balance,
        earned: user.wallet.earned,
        spent: user.wallet.spent,
        transaction,
        newAchievements: achievementResult.newAchievements || []
      };
    } catch (error) {
      console.error('High rating credit error:', error);
      return { success: false, error: 'Failed to award high rating credit' };
    }
  }

  // Spend credits for joining swap
  static async spendSwapParticipationCredit(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return { success: false, error: 'User not found' };

      const cost = 3; // Cost to join a swap

      // Check if user has enough credits
      if (user.wallet.balance < cost) {
        return { success: false, error: 'Insufficient credits to join swap' };
      }

      // Deduct credits
      user.wallet.balance -= cost;
      user.wallet.spent += cost;

      // Add transaction
      const transaction = {
        type: 'debit',
        amount: cost,
        reason: 'Swap participation fee',
        timestamp: new Date()
      };
      user.wallet.transactions.push(transaction);

      await user.save();

      return { 
        success: true, 
        message: 'Swap participation fee deducted',
        newBalance: user.wallet.balance,
        spent: user.wallet.spent,
        transaction
      };
    } catch (error) {
      console.error('Swap participation credit error:', error);
      return { success: false, error: 'Failed to deduct swap participation credit' };
    }
  }

  // Spend credits for premium features
  static async spendPremiumFeatureCredit(userId, featureName, cost) {
    try {
      const user = await User.findById(userId);
      if (!user) return { success: false, error: 'User not found' };

      // Check if user has enough credits
      if (user.wallet.balance < cost) {
        return { success: false, error: `Insufficient credits for ${featureName}` };
      }

      // Deduct credits
      user.wallet.balance -= cost;
      user.wallet.spent += cost;

      // Add transaction
      const transaction = {
        type: 'debit',
        amount: cost,
        reason: `Premium feature: ${featureName}`,
        timestamp: new Date()
      };
      user.wallet.transactions.push(transaction);

      await user.save();

      return { 
        success: true, 
        message: `${featureName} purchased successfully`,
        newBalance: user.wallet.balance,
        spent: user.wallet.spent,
        transaction
      };
    } catch (error) {
      console.error('Premium feature credit error:', error);
      return { success: false, error: 'Failed to purchase premium feature' };
    }
  }

  // Spend credits for webinar participation
  static async spendWebinarCredit(userId, webinarName) {
    try {
      const user = await User.findById(userId);
      if (!user) return { success: false, error: 'User not found' };

      const cost = 5; // Cost to join a webinar

      // Check if user has enough credits
      if (user.wallet.balance < cost) {
        return { success: false, error: 'Insufficient credits to join webinar' };
      }

      // Deduct credits
      user.wallet.balance -= cost;
      user.wallet.spent += cost;

      // Add transaction
      const transaction = {
        type: 'debit',
        amount: cost,
        reason: `Webinar participation: ${webinarName}`,
        timestamp: new Date()
      };
      user.wallet.transactions.push(transaction);

      await user.save();

      return { 
        success: true, 
        message: 'Webinar participation fee deducted',
        newBalance: user.wallet.balance,
        spent: user.wallet.spent,
        transaction
      };
    } catch (error) {
      console.error('Webinar credit error:', error);
      return { success: false, error: 'Failed to deduct webinar credit' };
    }
  }

  // Check and award milestone credits
  static async checkAndAwardMilestoneCredits(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return { success: false, error: 'User not found' };

      const completedSwaps = user.wallet.transactions.filter(t => 
        t.reason.includes('Swap completion')
      ).length;

      let milestoneCredits = 0;
      let milestoneReason = '';

      // Check for 5 swaps milestone
      if (completedSwaps >= 5) {
        const has5SwapMilestone = user.wallet.transactions.some(t => 
          t.reason === '5 swaps milestone bonus'
        );
        if (!has5SwapMilestone) {
          milestoneCredits = 25;
          milestoneReason = '5 swaps milestone bonus';
        }
      }

      // Check for 10 swaps milestone
      if (completedSwaps >= 10) {
        const has10SwapMilestone = user.wallet.transactions.some(t => 
          t.reason === '10 swaps milestone bonus'
        );
        if (!has10SwapMilestone) {
          milestoneCredits = 50;
          milestoneReason = '10 swaps milestone bonus';
        }
      }

      if (milestoneCredits > 0) {
        user.wallet.balance += milestoneCredits;
        user.wallet.earned += milestoneCredits;

        // Add transaction
        const transaction = {
          type: 'credit',
          amount: milestoneCredits,
          reason: milestoneReason,
          timestamp: new Date()
        };
        user.wallet.transactions.push(transaction);

        await user.save();

        // Check for achievements after awarding milestone credits
        const achievementResult = await AchievementService.checkAndAwardAchievements(userId);

        return { 
          success: true, 
          message: `Milestone credit awarded: ${milestoneReason}`,
          newBalance: user.wallet.balance,
          earned: user.wallet.earned,
          spent: user.wallet.spent,
          transaction,
          newAchievements: achievementResult.newAchievements || []
        };
      }

      return { success: false, message: 'No milestone credits to award' };
    } catch (error) {
      console.error('Milestone credit error:', error);
      return { success: false, error: 'Failed to check milestone credits' };
    }
  }
}

module.exports = CreditService; 