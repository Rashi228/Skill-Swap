class ReferralService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api/referrals';
  }

  // Validate a referral code
  async validateReferralCode(code) {
    try {
      const response = await fetch(`${this.baseURL}/validate/${code}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to validate referral code');
      }
      
      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Validate referral code error:', error);
      return { success: false, error: error.message };
    }
  }

  // Award credits to referrer
  async awardCredits(token, referredUserId) {
    try {
      const response = await fetch(`${this.baseURL}/award-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ referredUserId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to award credits');
      }
      
      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Award credits error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get referral statistics
  async getReferralStats(token) {
    try {
      const response = await fetch(`${this.baseURL}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch referral stats');
      }
      
      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Get referral stats error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new ReferralService(); 