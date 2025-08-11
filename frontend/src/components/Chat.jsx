import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaEdit, FaTrash, FaReply, FaTimes, FaVideo, FaPaperclip } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ChatService from '../services/chatService';

const Chat = ({ conversationId, onClose }) => {
  const { user: currentUser, token } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      loadConversation();
      setPage(1);
      loadMessages({ reset: true });
    }
  }, [conversationId]);

  useEffect(() => {
    if (socket) {
      // Listen for new messages
      socket.on('message_received', handleNewMessage);
      
      // Listen for typing indicators
      socket.on('user_typing', handleUserTyping);
      socket.on('user_stopped_typing', handleUserStoppedTyping);

      return () => {
        socket.off('message_received');
        socket.off('user_typing');
        socket.off('user_stopped_typing');
      };
    }
  }, [socket, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Infinite scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = async () => {
      if (el.scrollTop < 40 && hasMore && !loading) {
        const prevHeight = el.scrollHeight;
        const nextPage = page + 1;
        setPage(nextPage);
        await loadMessages({ prepend: true, pageOverride: nextPage });
        setTimeout(() => {
          el.scrollTop = el.scrollHeight - prevHeight;
        }, 0);
      }
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [hasMore, loading, page]);

  const loadConversation = async () => {
    try {
      const result = await ChatService.getConversation(token, conversationId);
      if (result.conversation) {
        setConversation(result.conversation);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const loadMessages = async ({ prepend = false, reset = false, pageOverride = null } = {}) => {
    try {
      if (reset) setLoading(true);
      const pg = pageOverride ?? page;
      const result = await ChatService.getMessages(token, conversationId, pg, 30);
      if (result.messages) {
        setHasMore(result.messages.length === 30);
        if (prepend) {
          setMessages(prev => [...result.messages, ...prev]);
        } else if (reset) {
          setMessages(result.messages);
        } else {
          setMessages(prev => [...prev, ...result.messages]);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      if (reset) setLoading(false);
    }
  };

  const handleNewMessage = (data) => {
    console.log('Socket message received:', data);
    if (data.conversationId !== conversationId) return;
    const incoming = data.message;
    console.log('Processing incoming message:', incoming);
    
    setMessages(prev => {
      const already = prev.some(m => m._id === incoming._id);
      console.log('Message already exists:', already);
      return already ? prev : [...prev, incoming];
    });
  };

  const handleUserTyping = (data) => {
    if (data.conversationId === conversationId && data.userId !== currentUser._id) {
      setTypingUsers(prev => {
        if (!prev.includes(data.userId)) {
          return [...prev, data.userId];
        }
        return prev;
      });
    }
  };

  const handleUserStoppedTyping = (data) => {
    if (data.conversationId === conversationId) {
      setTypingUsers(prev => prev.filter(id => id !== data.userId));
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const result = await ChatService.sendMessage(token, conversationId, newMessage, replyTo);
      
      if (result.message) {
        // Add message immediately for sender to see it instantly
        setMessages(prev => [...prev, result.message]);
        setNewMessage('');
        setReplyTo(null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async (messageId, content) => {
    try {
      const result = await ChatService.editMessage(token, messageId, content);
      if (result.message) {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? result.message : msg
        ));
        setEditingMessage(null);
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        const result = await ChatService.deleteMessage(token, messageId);
        if (result.message) {
          setMessages(prev => prev.filter(msg => msg._id !== messageId));
        }
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  };

  const handleTyping = () => {
    if (socket && conversation) {
      const participants = conversation.participants
        .filter(p => p.isActive && p.user._id !== currentUser._id)
        .map(p => p.user._id);

      socket.emit('typing_start', {
        conversationId,
        participants
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', {
          conversationId,
          participants
        });
      }, 2000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getIdStr = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (val._id) return val._id.toString();
    if (val.id) return val.id.toString();
    return val.toString ? val.toString() : '';
  };

  const isOwnMessage = (message) => {
    const senderId = getIdStr(message.sender);
    const meId = getIdStr(currentUser);
    return senderId && meId && senderId === meId;
  };

  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file || uploading) return;
    try {
      setUploading(true);
      console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      const result = await ChatService.uploadFile(token, conversationId, file);
      console.log('Upload result:', result);
      if (result.message && result.message._id) {
        console.log('Adding file message to UI:', result.message);
        console.log('File URL:', result.message.file?.url);
        setMessages(prev => [...prev, result.message]);
      } else {
        console.error('No message in upload result:', result);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleStartMeeting = async () => {
    try {
      const meetUrl = 'https://meet.google.com';
      const code = Math.random().toString(36).slice(2,5) + '-' + Math.random().toString(36).slice(2,6) + '-' + Math.random().toString(36).slice(2,5);
      const title = `Google Meet (${code})`;
      const result = await ChatService.sendMeetingLink(token, conversationId, `${meetUrl}/${code}`, title);
      if (result.message) {
        setMessages(prev => [...prev, result.message]);
        window.open(meetUrl, '_blank');
      }
    } catch (err) {
      console.error('Meeting send failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="chat-container">
        <div className="d-flex justify-content-center align-items-center h-100">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container bg-white rounded shadow-sm" style={{ height: '75vh', display: 'flex', flexDirection: 'column', width: 'min(96vw, 600px)' }}>
      {/* Chat Header */}
      <div className="chat-header p-3 border-bottom d-flex justify-content-between align-items-center">
        <div>
          <h6 className="mb-0 fw-bold">
            {conversation?.title || 'Chat'}
          </h6>
          {conversation?.swapId && (
            <small className="text-muted">
              Swap: {conversation.swapId.title}
            </small>
          )}
        </div>
        <div className="d-flex align-items-center" style={{gap:'8px'}}>
          <label className="btn btn-outline-secondary mb-0" title={uploading ? 'Uploading...' : 'Attach file'}>
            <FaPaperclip />
            <input type="file" className="d-none" onChange={handleFilePick} disabled={uploading} />
          </label>
          <button className="btn btn-outline-secondary" title="Start video call" onClick={handleStartMeeting}>
            <FaVideo />
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-grow-1 overflow-auto p-3" style={{ background:'#f8fafc' }}>
        {hasMore && (
          <div className="text-center mb-2"><small className="text-muted">Scroll up to load previous...</small></div>
        )}
        {messages.map((message) => (
          <div 
            key={message._id || `${message.content}-${message.createdAt}`} 
            className={`mb-3 ${isOwnMessage(message) ? 'text-end' : 'text-start'}`}
          >
            <div 
              className={`d-inline-block p-2 rounded-3 ${
                isOwnMessage(message) 
                  ? 'bg-primary text-white' 
                  : 'bg-light text-dark'
              }`}
              style={{ maxWidth: '70%' }}
            >
              {/* Reply indicator */}
              {message.replyTo && (
                <div className="mb-1 p-1 bg-dark bg-opacity-10 rounded">
                  <small className="text-muted">
                    Replying to: {message.replyTo.content.substring(0, 50)}...
                  </small>
                </div>
              )}
              
              {/* Message content */}
              <div className="message-content">
                {editingMessage === message._id ? (
                  <div className="d-flex align-items-center">
                    <input
                      type="text"
                      className="form-control form-control-sm me-2"
                      defaultValue={message.content}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleEditMessage(message._id, e.target.value);
                        }
                      }}
                      autoFocus
                    />
                    <button 
                      className="btn btn-sm btn-success me-1"
                      onClick={() => handleEditMessage(message._id, document.querySelector(`input[data-message-id="${message._id}"]`).value)}
                    >
                      ✓
                    </button>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => setEditingMessage(null)}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="d-flex justify-content-between align-items-start" style={{gap:'8px'}}>
                    <span>
                                             {message.type === 'image' ? (
                         <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${message.file?.url}`} alt={message.file?.name} style={{maxWidth:'320px', borderRadius:'8px'}} />
                       ) : message.type === 'file' || message.type === 'video' || message.type === 'audio' ? (
                         <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${message.file?.url}`} target="_blank" rel="noreferrer" className="text-decoration-none" download={message.file?.name}>
                           <FaPaperclip className="me-1" />{message.file?.name || 'Attachment'} (Click to download)
                         </a>
                       ) : message.type === 'meeting' ? (
                        <a href={message.systemData?.meetingUrl} target="_blank" rel="noreferrer" className="text-decoration-none">
                          📎 {message.content}
                        </a>
                      ) : (
                        message.content
                      )}
                    </span>
                    {isOwnMessage(message) && (
                      <div className="ms-2">
                        <button 
                          className="btn btn-sm btn-link p-0 me-1"
                          onClick={() => setEditingMessage(message._id)}
                        >
                          <FaEdit size={12} />
                        </button>
                        <button 
                          className="btn btn-sm btn-link p-0 text-danger"
                          onClick={() => handleDeleteMessage(message._id)}
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Message metadata */}
              <div className="mt-1">
                <small className="text-muted">
                  {formatTime(message.createdAt)}
                  {message.isEdited && ' (edited)'}
                </small>
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="text-muted small">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div className="p-2 bg-light border-top">
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Replying to: {replyTo.content.substring(0, 50)}...
            </small>
            <button 
              className="btn btn-sm btn-link p-0"
              onClick={() => setReplyTo(null)}
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="chat-input p-3 border-top" style={{background:'#fff'}}>
        <div className="d-flex align-items-center" style={{gap:'8px'}}>
          <input
            type="text"
            className="form-control"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={sending}
          />
          <button 
            className="btn btn-primary"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Sending...</span>
              </div>
            ) : (
              <FaPaperPlane />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat; 