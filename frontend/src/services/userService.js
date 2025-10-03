const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
class UserService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api`;
  }

  // Get current user data
  async getCurrentUser(token) {
    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const data = await response.json();
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Get current user error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update user profile
  async updateProfile(token, profileData) {
    try {
      const response = await fetch(`${this.baseURL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      const data = await response.json();
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update user skills
  async updateSkills(token, skillsData) {
    try {
      const response = await fetch(`${this.baseURL}/users/skills`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(skillsData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update skills');
      }
      
      const data = await response.json();
      return { success: true, skills: data.skills, skillsToLearn: data.skillsToLearn };
    } catch (error) {
      console.error('Update skills error:', error);
      return { success: false, error: error.message };
    }
  }

  // Add a skill
  async addSkill(token, skillData) {
    try {
      const response = await fetch(`${this.baseURL}/users/skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(skillData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add skill');
      }
      
      const data = await response.json();
      return { success: true, skill: data.skill };
    } catch (error) {
      console.error('Add skill error:', error);
      return { success: false, error: error.message };
    }
  }

  // Add a skill to learn
  async addSkillToLearn(token, skillData) {
    try {
      const response = await fetch(`${this.baseURL}/users/skills-to-learn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(skillData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add skill to learn');
      }
      
      const data = await response.json();
      return { success: true, skill: data.skill };
    } catch (error) {
      console.error('Add skill to learn error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update user preferences
  async updatePreferences(token, preferences) {
    try {
      const response = await fetch(`${this.baseURL}/users/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferences)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update preferences');
      }
      
      const data = await response.json();
      return { success: true, preferences: data.preferences };
    } catch (error) {
      console.error('Update preferences error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all users (for discovery)
  async getAllUsers(token, params = {}) {
    try {
      const queryString = params.toString();
      const response = await fetch(`${this.baseURL}/users?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Get all users error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user by ID
  async getUserById(token, userId) {
    try {
      const response = await fetch(`${this.baseURL}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const data = await response.json();
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Get user by ID error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send swap request
  async sendSwapRequest(token, requestData) {
    try {
      const response = await fetch(`${this.baseURL}/swaps/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send swap request');
      }
      
      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Send swap request error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get my swaps
  async getMySwaps(token, params = {}) {
    try {
      const queryString = params.toString();
      const response = await fetch(`${this.baseURL}/swaps/my-swaps?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch swaps');
      }
      
      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Get my swaps error:', error);
      return { success: false, error: error.message };
    }
  }

  // Respond to swap request
  async respondToSwap(token, swapId, action) {
    try {
      const response = await fetch(`${this.baseURL}/swaps/${swapId}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to respond to swap request');
      }
      
      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Respond to swap error:', error);
      return { success: false, error: error.message };
    }
  }

  // Cancel swap
  async cancelSwap(token, swapId) {
    try {
      const response = await fetch(`${this.baseURL}/swaps/${swapId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel swap');
      }
      
      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Cancel swap error:', error);
      return { success: false, error: error.message };
    }
  }

  // Complete swap
  async completeSwap(token, swapId) {
    try {
      const response = await fetch(`${this.baseURL}/swaps/${swapId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete swap');
      }
      
      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Complete swap error:', error);
      return { success: false, error: error.message };
    }
  }

  // Schedule a swap session
  async scheduleSwap(token, swapId, scheduleData) {
    try {
      const response = await fetch(`${this.baseURL}/swaps/${swapId}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(scheduleData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule swap');
      }
      
      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Schedule swap error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get calendar events
  async getCalendarEvents(token, month, year) {
    try {
      const response = await fetch(`${this.baseURL}/swaps/calendar?month=${month}&year=${year}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }
      
      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Get calendar events error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user achievements
  async getAchievements(token) {
    try {
      const response = await fetch(`${this.baseURL}/users/achievements`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }
      
      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Get achievements error:', error);
      return { success: false, error: error.message };
    }
  }

  // Check and award achievements
  async checkAchievements(token) {
    try {
      const response = await fetch(`${this.baseURL}/users/achievements/check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to check achievements');
      }
      
      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Check achievements error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get swap conversation
  async getSwapConversation(token, swapId) {
    try {
      const response = await fetch(`${this.baseURL}/chat/conversations/swap/${swapId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, conversationId: null };
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get swap conversation');
      }
      
      const data = await response.json();
      return { success: true, conversationId: data.conversationId };
    } catch (error) {
      console.error('Get swap conversation error:', error);
      return { success: false, error: error.message };
    }
  }

  // Create swap conversation
  async createSwapConversation(token, swapId) {
    try {
      const response = await fetch(`${this.baseURL}/chat/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'direct',
          swapId: swapId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create swap conversation');
      }
      
      const data = await response.json();
      return { success: true, conversationId: data.conversation._id };
    } catch (error) {
      console.error('Create swap conversation error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new UserService(); 