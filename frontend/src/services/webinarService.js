class WebinarService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api/webinars';
  }

  // Create a new webinar
  async createWebinar(token, webinarData) {
    try {
      console.log('Sending webinar data to:', `${this.baseURL}`);
      console.log('Webinar data:', webinarData);
      
      const response = await fetch(`${this.baseURL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(webinarData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const error = await response.json();
        console.error('Server error response:', error);
        throw new Error(error.error || error.message || 'Failed to create webinar');
      }

      const data = await response.json();
      console.log('Success response:', data);
      return { success: true, ...data };
    } catch (error) {
      console.error('Create webinar error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all public webinars
  async getWebinars(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const response = await fetch(`${this.baseURL}?${queryParams}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch webinars');
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Get webinars error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current user's webinars
  async getMyWebinars(token, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const response = await fetch(`${this.baseURL}/my?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch my webinars');
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Get my webinars error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get webinar by ID
  async getWebinarById(webinarId, token = null) {
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseURL}/${webinarId}`, {
        headers
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch webinar');
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Get webinar error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get webinar by meeting ID
  async getWebinarByMeetingId(meetingId, token = null) {
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseURL}/meeting/${meetingId}`, {
        headers
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch meeting');
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Get webinar by meeting ID error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update webinar
  async updateWebinar(token, webinarId, updateData) {
    try {
      const response = await fetch(`${this.baseURL}/${webinarId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update webinar');
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Update webinar error:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete webinar
  async deleteWebinar(token, webinarId) {
    try {
      const response = await fetch(`${this.baseURL}/${webinarId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete webinar');
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Delete webinar error:', error);
      return { success: false, error: error.message };
    }
  }

  // Join webinar
  async joinWebinar(token, webinarId) {
    try {
      const response = await fetch(`${this.baseURL}/${webinarId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join webinar');
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Join webinar error:', error);
      return { success: false, error: error.message };
    }
  }

  // Leave webinar
  async leaveWebinar(token, webinarId) {
    try {
      const response = await fetch(`${this.baseURL}/${webinarId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to leave webinar');
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Leave webinar error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update webinar status
  async updateWebinarStatus(token, webinarId, status) {
    try {
      const response = await fetch(`${this.baseURL}/${webinarId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update webinar status');
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Update webinar status error:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate meeting links for existing webinar
  async generateMeetingLinks(token, webinarId) {
    try {
      const response = await fetch(`${this.baseURL}/${webinarId}/generate-meeting-links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate meeting links');
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Generate meeting links error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new WebinarService(); 