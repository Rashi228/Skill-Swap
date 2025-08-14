const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ReviewService {
  // Create a new review
  static async createReview(token, reviewData) {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create review');
      }

      return data;
    } catch (error) {
      console.error('Create review error:', error);
      throw error;
    }
  }

  // Get reviews for a specific user
  static async getUserReviews(userId, options = {}) {
    try {
      const { page = 1, limit = 10, category, sort = 'recent' } = options;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort
      });

      if (category) {
        params.append('category', category);
      }

      const response = await fetch(`${API_BASE_URL}/reviews/user/${userId}?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get reviews');
      }

      return data;
    } catch (error) {
      console.error('Get user reviews error:', error);
      throw error;
    }
  }

  // Get reviews given by current user
  static async getMyReviews(token, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await fetch(`${API_BASE_URL}/reviews/my-reviews?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get my reviews');
      }

      return data;
    } catch (error) {
      console.error('Get my reviews error:', error);
      throw error;
    }
  }

  // Check if user can review another user
  static async canReview(token, userId, context = 'general') {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/can-review/${userId}?context=${context}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check review eligibility');
      }

      return data;
    } catch (error) {
      console.error('Check can review error:', error);
      throw error;
    }
  }

  // Get review statistics for a user
  static async getReviewStats(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/stats/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get review stats');
      }

      return data;
    } catch (error) {
      console.error('Get review stats error:', error);
      throw error;
    }
  }

  // Mark review as helpful
  static async markHelpful(token, reviewId) {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark review as helpful');
      }

      return data;
    } catch (error) {
      console.error('Mark helpful error:', error);
      throw error;
    }
  }

  // Unmark review as helpful
  static async unmarkHelpful(token, reviewId) {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/helpful`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unmark review as helpful');
      }

      return data;
    } catch (error) {
      console.error('Unmark helpful error:', error);
      throw error;
    }
  }
}

export default ReviewService; 