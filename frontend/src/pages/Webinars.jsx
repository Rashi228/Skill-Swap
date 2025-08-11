import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaCalendar, FaUsers, FaClock, FaUser, FaPlus, FaEye, FaEdit, FaExternalLinkAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import webinarService from '../services/webinarService';

const Webinars = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedWebinar, setSelectedWebinar] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    topic: '',
    status: ''
  });

  useEffect(() => {
    loadWebinars();
  }, [filters]);

  const loadWebinars = async () => {
    try {
      setLoading(true);
      const response = await webinarService.getWebinars(filters);
      if (response.success) {
        setWebinars(response.webinars);
      } else {
        setError(response.error);
      }
    } catch (error) {
      setError('Failed to load webinars');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWebinar = async (webinar) => {
    if (!token) {
      setError('Please login to join webinars');
      return;
    }

    try {
      // First join the webinar
      const response = await webinarService.joinWebinar(token, webinar._id);
      if (response.success) {
        setSuccess('Successfully joined webinar!');
        
        // Then open the meeting link
        if (webinar.meetingLink) {
          window.open(webinar.meetingLink, '_blank');
        } else {
          setError('Meeting link not available for this webinar.');
        }
        
        loadWebinars(); // Refresh the list
      } else {
        setError(response.error);
      }
    } catch (error) {
      setError('Failed to join webinar');
    }
  };

  const handleViewDetails = (webinar) => {
    setSelectedWebinar(webinar);
    setShowDetailsModal(true);
  };

  const handleManageWebinar = async (webinar) => {
    // Check if meeting links exist
    if (!webinar.hostMeetingLink && !webinar.meetingLink) {
      // Generate meeting links if they don't exist
      try {
        setLoading(true);
        const response = await webinarService.generateMeetingLinks(token, webinar._id);
        if (response.success) {
          // Update the webinar data with new meeting links
          const updatedWebinar = response.webinar;
          
          // Show instructions and open Google Meet
          const meetCode = updatedWebinar.meetingLink.split('/').pop();
          const instructions = `To start your webinar meeting:

1. Click "OK" to open Google Meet
2. When Google Meet opens, click "Create meeting"
3. Copy this meeting code: ${meetCode}
4. Share this code with participants: ${updatedWebinar.meetingLink}

Participants can join using the same link.`;
          
          if (confirm(instructions)) {
            window.open('https://meet.google.com', '_blank');
          }
          
          // Refresh the webinars list to show updated data
          loadWebinars();
        } else {
          setError(response.error || 'Failed to generate meeting links');
        }
      } catch (error) {
        setError('Failed to generate meeting links');
      } finally {
        setLoading(false);
      }
    } else {
      // Show instructions and open Google Meet
      const meetCode = webinar.meetingLink.split('/').pop();
      const instructions = `To start your webinar meeting:

1. Click "OK" to open Google Meet
2. When Google Meet opens, click "Create meeting"
3. Copy this meeting code: ${meetCode}
4. Share this code with participants: ${webinar.meetingLink}

Participants can join using the same link.`;
      
      if (confirm(instructions)) {
        window.open('https://meet.google.com', '_blank');
      }
    }
  };

  const isHost = (webinar) => {
    return user && webinar.host._id.toString() === user._id.toString();
  };

  const isParticipant = (webinar) => {
    return user && webinar.participants.some(p => p.user._id.toString() === user._id.toString());
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionButton = (webinar) => {
    if (!user) {
      return (
        <button className="btn btn-primary flex-fill" disabled>
          Login to Join
        </button>
      );
    }

    if (isHost(webinar)) {
      return (
        <button 
          className="btn btn-success flex-fill"
          onClick={() => handleManageWebinar(webinar)}
        >
          <FaEdit className="me-1" />
          Start Meeting
        </button>
      );
    }

    if (isParticipant(webinar)) {
      return (
        <button className="btn btn-secondary flex-fill" disabled>
          Already Joined
        </button>
      );
    }

    if (webinar.currentParticipants >= webinar.maxParticipants) {
      return (
        <button className="btn btn-outline-secondary flex-fill" disabled>
          Full
        </button>
      );
    }

    if (webinar.status !== 'upcoming') {
      return (
        <button className="btn btn-outline-secondary flex-fill" disabled>
          {webinar.status === 'live' ? 'Live' : 'Completed'}
        </button>
      );
    }

    return (
      <button
        className="btn btn-primary flex-fill"
        onClick={() => handleJoinWebinar(webinar)}
      >
        Join Webinar
      </button>
    );
  };

  return (
    <div className="container-fluid py-4" style={{background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)', minHeight: '100vh'}}>
      <div className="container">
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}
        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
          </div>
        )}

        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="fw-bold" style={{color: '#185a9d'}}>Discover Webinars</h2>
                             <button 
                 className="btn btn-primary"
                 onClick={() => navigate('/dashboard?tab=webinars')}
               >
                 <FaPlus className="me-2" />
                 Create Webinar
               </button>
            </div>

            {/* Filters */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaSearch />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search webinars..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={filters.topic}
                      onChange={(e) => handleFilterChange('topic', e.target.value)}
                    >
                      <option value="">All Topics</option>
                      <option value="javascript">JavaScript</option>
                      <option value="react">React</option>
                      <option value="design">Design</option>
                      <option value="marketing">Marketing</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="live">Live</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <button className="btn btn-outline-secondary w-100">
                      <FaFilter className="me-1" />
                      Filter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Webinars Grid */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : webinars.length === 0 ? (
              <div className="text-center py-5">
                <FaCalendar size={64} className="text-muted mb-3" />
                <h4 className="text-muted">No webinars found</h4>
                <p className="text-muted">Try adjusting your filters or check back later for new webinars.</p>
              </div>
            ) : (
              <div className="row g-4">
                {webinars.map(webinar => (
                  <div key={webinar._id} className="col-lg-4 col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <span className={`badge ${webinar.status === 'upcoming' ? 'bg-primary' : webinar.status === 'live' ? 'bg-success' : webinar.status === 'completed' ? 'bg-secondary' : 'bg-danger'}`}>
                            {webinar.status}
                          </span>
                          <small className="text-muted">
                            {webinar.price > 0 ? `$${webinar.price}` : 'Free'}
                          </small>
                        </div>
                        
                        <h5 className="card-title mb-2">{webinar.title}</h5>
                        <p className="card-text text-secondary mb-3">
                          {webinar.description.length > 100 
                            ? `${webinar.description.substring(0, 100)}...` 
                            : webinar.description
                          }
                        </p>
                        
                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <FaUser className="text-muted me-2" />
                            <small className="text-muted">
                              Hosted by {webinar.host.firstName} {webinar.host.lastName}
                              {isHost(webinar) && <span className="badge bg-info ms-2">You</span>}
                            </small>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <FaCalendar className="text-muted me-2" />
                            <small className="text-muted">
                              {formatDate(webinar.scheduledDate)}
                            </small>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <FaClock className="text-muted me-2" />
                            <small className="text-muted">
                              {webinar.duration} minutes
                            </small>
                          </div>
                          <div className="d-flex align-items-center">
                            <FaUsers className="text-muted me-2" />
                            <small className="text-muted">
                              {webinar.currentParticipants}/{webinar.maxParticipants} participants
                            </small>
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          {getActionButton(webinar)}
                          <button 
                            className="btn btn-outline-secondary"
                            onClick={() => handleViewDetails(webinar)}
                          >
                            <FaEye className="me-1" />
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedWebinar && (
        <div className="modal fade show" style={{display: 'block'}} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Webinar Details</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDetailsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-8">
                    <h4>{selectedWebinar.title}</h4>
                    <p className="text-secondary">{selectedWebinar.description}</p>
                    
                    <div className="mb-3">
                      <strong>Topic:</strong> {selectedWebinar.topic}
                    </div>
                    
                    <div className="mb-3">
                      <strong>Date & Time:</strong> {formatDate(selectedWebinar.scheduledDate)}
                    </div>
                    
                    <div className="mb-3">
                      <strong>Duration:</strong> {selectedWebinar.duration} minutes
                    </div>
                    
                    <div className="mb-3">
                      <strong>Price:</strong> {selectedWebinar.price > 0 ? `$${selectedWebinar.price}` : 'Free'}
                    </div>
                    
                    {selectedWebinar.tags && selectedWebinar.tags.length > 0 && (
                      <div className="mb-3">
                        <strong>Tags:</strong>
                        <div className="mt-1">
                          {selectedWebinar.tags.map((tag, index) => (
                            <span key={index} className="badge bg-light text-dark me-1">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="col-md-4">
                    <div className="card">
                      <div className="card-body">
                        <h6>Host Information</h6>
                        <div className="d-flex align-items-center mb-2">
                          <FaUser className="text-muted me-2" />
                          <span>{selectedWebinar.host.firstName} {selectedWebinar.host.lastName}</span>
                        </div>
                        
                        <h6 className="mt-3">Webinar Status</h6>
                        <span className={`badge ${selectedWebinar.status === 'upcoming' ? 'bg-primary' : selectedWebinar.status === 'live' ? 'bg-success' : selectedWebinar.status === 'completed' ? 'bg-secondary' : 'bg-danger'}`}>
                          {selectedWebinar.status}
                        </span>
                        
                        <h6 className="mt-3">Participants</h6>
                        <div className="d-flex align-items-center">
                          <FaUsers className="text-muted me-2" />
                          <span>{selectedWebinar.currentParticipants}/{selectedWebinar.maxParticipants}</span>
                        </div>
                        
                                                                          {selectedWebinar.meetingLink && (
                            <div className="mt-3">
                              <h6>Google Meet Link</h6>
                              <a 
                                href={selectedWebinar.meetingLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-primary"
                              >
                                <FaExternalLinkAlt className="me-1" />
                                Join Google Meet
                              </a>
                              <div className="mt-2">
                                <small className="text-muted">
                                  Meeting Code: {selectedWebinar.meetingLink.split('/').pop()}
                                </small>
                              </div>
                              <div className="mt-2">
                                <small className="text-info">
                                  <strong>Note:</strong> Click the button above to join the meeting. The host will need to create the meeting in Google Meet first.
                                </small>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
                {!isHost(selectedWebinar) && selectedWebinar.status === 'upcoming' && selectedWebinar.currentParticipants < selectedWebinar.maxParticipants && (
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => {
                      handleJoinWebinar(selectedWebinar);
                      setShowDetailsModal(false);
                    }}
                  >
                    Join Webinar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Backdrop */}
      {showDetailsModal && (
        <div className="modal-backdrop fade show"></div>
      )}
    </div>
  );
};

export default Webinars; 