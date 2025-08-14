class AchievementService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  }

  // Get user's achievements
  async getUserAchievements(token) {
    try {
      const response = await fetch(`${this.baseURL}/api/achievements`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }
      
      const data = await response.json();
      return { success: true, achievements: data.achievements };
    } catch (error) {
      console.error('Get achievements error:', error);
      return { success: false, error: error.message };
    }
  }

  // Check and award achievements
  async checkAchievements(token) {
    try {
      const response = await fetch(`${this.baseURL}/api/achievements/check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to check achievements');
      }
      
      const data = await response.json();
      return { 
        success: true, 
        newAchievements: data.newAchievements || [],
        totalBadges: data.totalBadges,
        level: data.level,
        experience: data.experience
      };
    } catch (error) {
      console.error('Check achievements error:', error);
      return { success: false, error: error.message };
    }
  }

  // Award specific achievement
  async awardAchievement(token, achievementKey) {
    try {
      const response = await fetch(`${this.baseURL}/api/achievements/award/${achievementKey}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to award achievement');
      }
      
      const data = await response.json();
      return { 
        success: true, 
        newAchievement: data.newAchievement,
        totalBadges: data.totalBadges,
        level: data.level,
        experience: data.experience
      };
    } catch (error) {
      console.error('Award achievement error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new AchievementService(); 