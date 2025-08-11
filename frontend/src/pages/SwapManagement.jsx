import React, { useState, useEffect } from 'react';
import { FaExchangeAlt, FaCheckCircle, FaTimes, FaClock, FaStar, FaUserCircle, FaComments } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import userService from '../services/userService';
import Chat from '../components/Chat';

const SwapManagement = () => {
  const { token, user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [showChat, setShowChat] = useState(false);

  // Define before any effects that reference it to avoid TDZ errors
  const loadSwaps = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }
      const result = await userService.getMySwaps(token, params);
      if (result.success) {
        setSwaps(result.swaps);
        setTotalPages(result.pagination.pages);
      } else {
        setError('Failed to load swaps');
      }
    } catch (error) {
      setError('Error loading swaps');
      console.error('Error loading swaps:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSwaps();
  }, [token, activeTab, currentPage]);

  // Real-time socket listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new swap requests
    const handleNewSwapRequest = (data) => {
      console.log('New swap request received:', data);
      // Reload swaps to show new request
      loadSwaps();
      // Show notification
      alert(`New swap request from ${data.fromUser.firstName} ${data.fromUser.lastName}!`);
    };

    // Listen for swap responses
    const handleSwapResponse = (data) => {
      console.log('Swap response received:', data);
      // Reload swaps to show updated status
      loadSwaps();
      // Show notification
      alert(`Your swap request has been ${data.action}!`);
    };

    socket.on('new_swap_request', handleNewSwapRequest);
    socket.on('swap_response_received', handleSwapResponse);

    return () => {
      socket.off('new_swap_request', handleNewSwapRequest);
      socket.off('swap_response_received', handleSwapResponse);
    };
  }, [socket, loadSwaps]);

  // loadSwaps is defined above

  const handleRespondToSwap = async (swapId, action) => {
    try {
      const result = await userService.respondToSwap(token, swapId, action);
      
      if (result.success) {
        // Reload swaps to get updated data
        loadSwaps();
        alert(`Swap request ${action}ed successfully!`);
      } else {
        setError(result.error || 'Failed to respond to swap request');
      }
    } catch (error) {
      setError('Error responding to swap request');
      console.error('Error responding to swap:', error);
    }
  };

  const handleCancelSwap = async (swapId) => {
    if (!window.confirm('Are you sure you want to cancel this swap?')) return;
    
    try {
      const result = await userService.cancelSwap(token, swapId);
      
      if (result.success) {
        loadSwaps();
        alert('Swap cancelled successfully!');
      } else {
        setError(result.error || 'Failed to cancel swap');
      }
    } catch (error) {
      setError('Error cancelling swap');
      console.error('Error cancelling swap:', error);
    }
  };

  const handleCompleteSwap = async (swapId) => {
    if (!window.confirm('Are you sure you want to mark this swap as completed?')) return;
    
    try {
      const result = await userService.completeSwap(token, swapId);
      
      if (result.success) {
        loadSwaps();
        alert('Swap marked as completed!');
      } else {
        setError(result.error || 'Failed to complete swap');
      }
    } catch (error) {
      setError('Error completing swap');
      console.error('Error completing swap:', error);
    }
  };

  const handleScheduleSwap = async (swapId) => {
    // Get date and time from user
    const scheduledDate = prompt('Enter the date (YYYY-MM-DD):');
    if (!scheduledDate) return;
    
    const startTime = prompt('Enter the start time (HH:MM):');
    if (!startTime) return;
    
    const endTime = prompt('Enter the end time (HH:MM):');
    if (!endTime) return;
    
    const title = prompt('Enter event title:');
    if (!title) return;
    
    const description = prompt('Enter event description (optional):') || '';
    
    try {
      const scheduleData = {
        scheduledDate: `${scheduledDate}T00:00:00.000Z`,
        eventDetails: {
          title,
          description,
          startTime,
          endTime
        }
      };
      
      const result = await userService.scheduleSwap(token, swapId, scheduleData);
      
      if (result.success) {
        loadSwaps();
        alert('Swap session scheduled successfully!');
      } else {
        setError(result.error || 'Failed to schedule swap');
      }
    } catch (error) {
      setError('Error scheduling swap');
      console.error('Error scheduling swap:', error);
    }
  };

  const handleOpenChat = async (swap) => {
    try {
      // Check if conversation already exists for this swap
      const chatResult = await userService.getSwapConversation(token, swap._id);
      
      if (chatResult.success && chatResult.conversationId) {
        setSelectedConversationId(chatResult.conversationId);
        setShowChat(true);
      } else {
        // Create new conversation for this swap
        const createResult = await userService.createSwapConversation(token, swap._id);
        
        if (createResult.success) {
          setSelectedConversationId(createResult.conversationId);
          setShowChat(true);
        } else {
          setError('Failed to create chat conversation');
        }
      }
    } catch (error) {
      setError('Error opening chat');
      console.error('Error opening chat:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'warning', icon: <FaClock />, text: 'Pending' },
      accepted: { color: 'success', icon: <FaCheckCircle />, text: 'Accepted' },
      rejected: { color: 'danger', icon: <FaTimes />, text: 'Rejected' },
      completed: { color: 'primary', icon: <FaStar />, text: 'Completed' },
      cancelled: { color: 'secondary', icon: <FaTimes />, text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`badge bg-${config.color} d-flex align-items-center gap-1`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const getSwapRole = (swap) => {
    if (!user || !swap) return 'viewer';
    const currentUserId = user._id?.toString?.() || user._id;
    const requesterId = (swap.requester?._id || swap.requester)?.toString?.() || '';
    const recipientId = (swap.recipient?._id || swap.recipient)?.toString?.() || '';
    if (requesterId && requesterId === currentUserId) return 'requester';
    if (recipientId && recipientId === currentUserId) return 'recipient';
    return 'viewer';
  };

  if (loading && swaps.length === 0) {
    return (
      <div className="py-5 d-flex justify-content-center align-items-center" style={{background:'linear-gradient(135deg,#e0eafc 0%,#cfdef3 100%)', minHeight:'100vh'}}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-5" style={{background:'linear-gradient(135deg,#e0eafc 0%,#cfdef3 100%)', minHeight:'100vh'}}>
      <div className="container">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="fw-bold mb-3" style={{color:'#185a9d'}}>My Swaps</h1>
          <p className="text-secondary">Manage your skill swap requests and ongoing exchanges</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-4 shadow p-4 mb-4">
          <div className="d-flex gap-2 flex-wrap">
            <button
              className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveTab('all')}
            >
              All Swaps
            </button>
            <button
              className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending
            </button>
            <button
              className={`btn ${activeTab === 'accepted' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveTab('accepted')}
            >
              Active
            </button>
            <button
              className={`btn ${activeTab === 'completed' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Swaps List */}
        {swaps.length === 0 ? (
          <div className="text-center py-5">
            <FaExchangeAlt size={64} className="text-muted mb-3" />
            <h5 className="text-muted">No swaps found</h5>
            <p className="text-muted">
              {activeTab === 'all' && "You haven't made any swap requests yet."}
              {activeTab === 'pending' && "No pending swap requests."}
              {activeTab === 'accepted' && "No active swaps."}
              {activeTab === 'completed' && "No completed swaps."}
            </p>
            <a href="/users" className="btn btn-primary">
              Discover Users
            </a>
          </div>
        ) : (
          <div className="row g-4">
            {swaps.map(swap => (
              <div key={swap._id} className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="row align-items-center">
                      {/* User Info */}
                      <div className="col-md-3">
                        <div className="d-flex align-items-center">
                          <div className="me-3">
                            {swap.requester.profilePicture ? (
                              <img
                                src={swap.requester.profilePicture}
                                alt={swap.requester.firstName}
                                className="rounded-circle"
                                style={{width: '50px', height: '50px', objectFit: 'cover'}}
                              />
                            ) : (
                              <FaUserCircle size={50} className="text-muted" />
                            )}
                          </div>
                          <div>
                            <h6 className="mb-1 fw-bold">
                              {swap.requester.firstName} {swap.requester.lastName}
                            </h6>
                            <small className="text-muted">@{swap.requester.username}</small>
                          </div>
                        </div>
                      </div>

                      {/* Swap Details */}
                      <div className="col-md-4">
                        <div className="mb-2">
                          <small className="text-muted">You teach:</small>
                          <div className="fw-bold text-primary">{swap.requesterSkill.name}</div>
                        </div>
                        <div>
                          <small className="text-muted">You learn:</small>
                          <div className="fw-bold text-warning">{swap.recipientSkill.name}</div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-md-2 text-center">
                        {getStatusBadge(swap.status)}
                      </div>

                      {/* Date */}
                      <div className="col-md-2 text-center">
                        <small className="text-muted">
                          {new Date(swap.requestedAt).toLocaleDateString()}
                        </small>
                      </div>

                      {/* Actions */}
                      <div className="col-md-1">
                        <div className="d-flex flex-column gap-1">
                          {swap.status === 'pending' && getSwapRole(swap) === 'recipient' && (
                            <>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleRespondToSwap(swap._id, 'accept')}
                                title="Accept"
                              >
                                <FaCheckCircle />
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleRespondToSwap(swap._id, 'reject')}
                                title="Reject"
                              >
                                <FaTimes />
                              </button>
                            </>
                          )}
                          
                          {['pending', 'accepted'].includes(swap.status) && (
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleCancelSwap(swap._id)}
                              title="Cancel"
                            >
                              <FaTimes />
                            </button>
                          )}
                          
                          {swap.status === 'accepted' && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleCompleteSwap(swap._id)}
                              title="Mark as Completed"
                            >
                              <FaCheckCircle />
                            </button>
                          )}
                          
                          {swap.status === 'accepted' && !swap.scheduledDate && (
                            <button
                              className="btn btn-outline-success btn-sm"
                              onClick={() => handleScheduleSwap(swap._id)}
                              title="Schedule Session"
                            >
                              <FaClock />
                            </button>
                          )}
                          
                          {swap.status === 'accepted' && (
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleOpenChat(swap)}
                              title="Open Chat"
                            >
                              <FaComments />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    {swap.message && (
                      <div className="mt-3 pt-3 border-top">
                        <small className="text-muted">Message:</small>
                        <p className="mb-0">{swap.message}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-5">
            <nav>
              <ul className="pagination">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    </li>
                  );
                })}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}

        {/* Chat Components */}
        {showChat && selectedConversationId && (
          <div className="position-fixed top-50 start-50 translate-middle" style={{ zIndex: 1060 }}>
            <Chat 
              conversationId={selectedConversationId} 
              onClose={() => {
                setShowChat(false);
                setSelectedConversationId(null);
              }}
            />
          </div>
        )}

        {/* Chat List removed per request: bottom-right floating icon */}
      </div>
    </div>
  );
};

export default SwapManagement; 