import React, { useState, useEffect } from 'react';
import { FaComments, FaSearch, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import ChatService from '../services/chatService';

const ChatList = ({ onSelectConversation, selectedConversationId }) => {
  const { user: currentUser, token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showChatList, setShowChatList] = useState(false);

  useEffect(() => {
    if (showChatList) {
      loadConversations();
    }
  }, [showChatList]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const result = await ChatService.getConversations(token);
      if (result.conversations) {
        setConversations(result.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const title = conversation.title?.toLowerCase() || '';
    const participantNames = conversation.participants
      .map(p => `${p.user.firstName} ${p.user.lastName}`.toLowerCase())
      .join(' ');
    
    return title.includes(searchLower) || participantNames.includes(searchLower);
  });

  const formatLastMessage = (message) => {
    if (!message) return 'No messages yet';
    
    const content = message.content;
    const sender = message.sender;
    const isOwn = sender._id === currentUser._id;
    
    return `${isOwn ? 'You' : `${sender.firstName} ${sender.lastName}`}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getUnreadCount = (conversation) => {
    return conversation.unreadCount || 0;
  };

  const getConversationTitle = (conversation) => {
    if (conversation.title) return conversation.title;
    
    // For direct conversations, show the other participant's name
    const otherParticipant = conversation.participants.find(p => 
      p.user._id !== currentUser._id && p.isActive
    );
    
    if (otherParticipant) {
      return `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`;
    }
    
    return 'Unknown User';
  };

  const getConversationAvatar = (conversation) => {
    // For direct conversations, show the other participant's avatar
    const otherParticipant = conversation.participants.find(p => 
      p.user._id !== currentUser._id && p.isActive
    );
    
    if (otherParticipant?.user.profilePicture) {
      return otherParticipant.user.profilePicture;
    }
    
    return null;
  };

  if (!showChatList) {
    return (
      <div className="position-fixed bottom-0 end-0 m-3" style={{ zIndex: 1050 }}>
        <button 
          className="btn btn-primary rounded-circle shadow"
          style={{ width: '60px', height: '60px' }}
          onClick={() => setShowChatList(true)}
        >
          <FaComments size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className="position-fixed bottom-0 end-0 m-3" style={{ zIndex: 1050 }}>
      <div className="card shadow" style={{ width: '350px', height: '500px' }}>
        {/* Header */}
        <div className="card-header d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold">
            <FaComments className="me-2" />
            Messages
          </h6>
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setShowChatList(false)}
          >
            <FaTimes />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-bottom">
          <div className="input-group">
            <span className="input-group-text">
              <FaSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-grow-1 overflow-auto" style={{ height: '350px' }}>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center p-4 text-muted">
              <FaComments size={48} className="mb-3" />
              <p>No conversations yet</p>
              <small>Start a swap to begin chatting!</small>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation._id}
                  className={`list-group-item list-group-item-action border-0 ${
                    selectedConversationId === conversation._id ? 'active' : ''
                  }`}
                  onClick={() => onSelectConversation(conversation._id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-center">
                    {/* Avatar */}
                    <div className="me-3 position-relative">
                      {getConversationAvatar(conversation) ? (
                        <img
                          src={getConversationAvatar(conversation)}
                          alt="Avatar"
                          className="rounded-circle"
                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div 
                          className="rounded-circle bg-secondary d-flex align-items-center justify-content-center"
                          style={{ width: '40px', height: '40px' }}
                        >
                          <span className="text-white fw-bold">
                            {getConversationTitle(conversation).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      {/* Online indicator */}
                      {conversation.participants.some(p => 
                        p.user._id !== currentUser._id && p.isActive && p.user.isOnline
                      ) && (
                        <div 
                          className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white"
                          style={{ width: '12px', height: '12px' }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-grow-1 text-start">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="mb-1 fw-bold">
                          {getConversationTitle(conversation)}
                        </h6>
                        <small className="text-muted">
                          {formatTime(conversation.lastMessage?.timestamp)}
                        </small>
                      </div>
                      
                      <p className="mb-1 small text-muted">
                        {formatLastMessage(conversation.lastMessage)}
                      </p>
                      
                      {/* Swap info */}
                      {conversation.swapId && (
                        <small className="text-primary">
                          Swap: {conversation.swapId.title}
                        </small>
                      )}
                    </div>

                    {/* Unread count */}
                    {getUnreadCount(conversation) > 0 && (
                      <div className="ms-2">
                        <span className="badge bg-primary rounded-pill">
                          {getUnreadCount(conversation)}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatList; 