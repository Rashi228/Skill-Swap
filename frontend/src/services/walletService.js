const API_BASE_URL = 'http://localhost:5000/api';

class WalletService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get wallet balance and summary
  async getWalletBalance(token) {
    try {
      const response = await fetch(`${this.baseURL}/wallet/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch wallet balance');
      }
      
      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Get wallet balance error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get transaction history
  async getTransactions(token, options = {}) {
    try {
      const { page = 1, limit = 10, type, search } = options;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (type) params.append('type', type);
      if (search) params.append('search', search);

      const response = await fetch(`${this.baseURL}/wallet/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch transactions`);
      }
      
      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Get transactions error:', error);
      return { success: false, error: error.message };
    }
  }



  // Spend credits from wallet
  async spendCredits(token, amount, description) {
    try {
      const response = await fetch(`${this.baseURL}/wallet/spend-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount, description })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to spend credits');
      }
      
      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Spend credits error:', error);
      return { success: false, error: error.message };
    }
  }

  // Transfer credits to another user
  async transferCredits(token, toUserId, amount, description) {
    try {
      const response = await fetch(`${this.baseURL}/wallet/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ toUserId, amount, description })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transfer credits');
      }
      
      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Transfer credits error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new WalletService(); 