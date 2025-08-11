const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CHAT_API = `${API_BASE}/api/chat`;

class ChatService {
  static async getConversations(token, page = 1, limit = 20, type = '') {
    try {
      const response = await fetch(`${CHAT_API}/conversations?page=${page}&limit=${limit}&type=${type}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return { error: 'Failed to fetch conversations' };
    }
  }

  static async getConversation(token, conversationId) {
    try {
      const response = await fetch(`${CHAT_API}/conversations/${conversationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return { error: 'Failed to fetch conversation' };
    }
  }

  static async getMessages(token, conversationId, page = 1, limit = 50, before = '') {
    try {
      const response = await fetch(`${CHAT_API}/conversations/${conversationId}/messages?page=${page}&limit=${limit}&before=${before}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { error: 'Failed to fetch messages' };
    }
  }

  static async sendMessage(token, conversationId, content, replyTo = null) {
    try {
      const payload = replyTo ? { content, replyTo } : { content };
      const response = await fetch(`${CHAT_API}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        const msg = data?.error || 'Failed to send message';
        throw new Error(msg);
      }
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return { error: 'Failed to send message' };
    }
  }

  static async uploadFile(token, conversationId, file) {
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch(`${CHAT_API}/conversations/${conversationId}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: form
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to upload file');
      }
      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  static async sendMeetingLink(token, conversationId, meetingUrl, meetingTitle) {
    try {
      const response = await fetch(`${CHAT_API}/conversations/${conversationId}/meeting`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ meetingUrl, meetingTitle })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending meeting link:', error);
      return { error: 'Failed to send meeting link' };
    }
  }

  static async createConversation(token, type, participants, title = null, swapId = null) {
    try {
      const response = await fetch(`${CHAT_API}/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          participants,
          title,
          swapId
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { error: 'Failed to create conversation' };
    }
  }

  static async editMessage(token, messageId, content) {
    try {
      const response = await fetch(`${CHAT_API.replace('/chat','')}/chat/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Failed to edit message');
      return data;
    } catch (error) {
      console.error('Error editing message:', error);
      return { error: 'Failed to edit message' };
    }
  }

  static async deleteMessage(token, messageId) {
    try {
      const response = await fetch(`${CHAT_API.replace('/chat','')}/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Failed to delete message');
      return data;
    } catch (error) {
      console.error('Error deleting message:', error);
      return { error: error.message || 'Failed to delete message' };
    }
  }
}

export default ChatService; 