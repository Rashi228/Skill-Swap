import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaStar, FaTools, FaLightbulb, FaMapMarkerAlt, FaLink, FaExchangeAlt, FaComments, FaArrowLeft, FaMedal, FaCalendarAlt, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import userService from '../services/userService';

const UserProfile = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser, token } = useAuth();
  const { emitSwapRequest } = useSocket();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Swap request modal
  const [showSwapModal, setShowSwapModal] = useState(location.state?.openSwapModal || false);
  const [swapRequest, setSwapRequest] = useState({
    skillToTeach: '',
    skillToLearn: '',
    message: ''
  });
  const [sendingRequest, setSendingRequest] = useState(false);

  // Normalize skill arrays for dropdowns (support objects with {name} or plain strings)
  const normalizeSkillName = (skill) => (typeof skill === 'string' ? skill : (skill?.name || ''));
  const teachableSkills = (() => {
    if (Array.isArray(currentUser?.skills) && currentUser.skills.length > 0) return currentUser.skills;
    if (Array.isArray(currentUser?.profile?.skills) && currentUser.profile.skills.length > 0) return currentUser.profile.skills;
    return [];
  })();
  const learnableSkills = Array.isArray(user?.skills) ? user.skills : (Array.isArray(user?.profile?.skills) ? user.profile.skills : []);

  useEffect(() => {
    loadUserProfile();
  }, [userId, token]);

  const loadUserProfile = async () => {
    if (!token || !userId) return;
    
    try {
      setLoading(true);
      const result = await userService.getUserById(token, userId);
      
      if (result.success) {
        setUser(result.user);
      } else {
        setError('Failed to load user profile');
      }
    } catch (error) {
      setError('Error loading user profile');
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwapRequest = async () => {
    if (!swapRequest.skillToTeach || !swapRequest.skillToLearn) {
      setError('Please select skills to teach and learn');
      return;
    }

    try {
      setSendingRequest(true);
      const result = await userService.sendSwapRequest(token, {
        toUserId: userId,
        skillToTeach: swapRequest.skillToTeach,
        skillToLearn: swapRequest.skillToLearn,
        message: swapRequest.message
      });

      if (result.success) {
        setShowSwapModal(false);
        setSwapRequest({ skillToTeach: '', skillToLearn: '', message: '' });
        
        // Emit socket event for real-time notification
        emitSwapRequest({
          toUserId: userId,
          fromUserId: currentUser._id,
          skillToTeach: swapRequest.skillToTeach,
          skillToLearn: swapRequest.skillToLearn,
          message: swapRequest.message
        });
        
        // Show success notification
        if (window.showNotification) {
          window.showNotification('Swap request sent successfully!', 'success', 4000);
        }
      } else {
        setError(result.error || 'Failed to send swap request');
        if (window.showNotification) {
          window.showNotification(result.error || 'Failed to send swap request', 'error', 4000);
        }
      }
    } catch (error) {
      setError('Error sending swap request');
      console.error('Error sending swap request:', error);
      if (window.showNotification) {
        window.showNotification('Error sending swap request', 'error', 4000);
      }
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="py-5 d-flex justify-content-center align-items-center" style={{background:'linear-gradient(135deg,#e0eafc 0%,#cfdef3 100%)', minHeight:'100vh'}}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="py-5" style={{background:'linear-gradient(135deg,#e0eafc 0%,#cfdef3 100%)', minHeight:'100vh'}}>
        <div className="container">
          <div className="text-center">
            <h3 className="text-danger">Error</h3>
            <p className="text-muted">{error || 'User not found'}</p>
            <button className="btn btn-primary" onClick={() => navigate('/discover')}>
              <FaArrowLeft className="me-2" />
              Back to Discovery
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Don't show swap request button if viewing own profile
  const isOwnProfile = currentUser?._id === userId;

  return (
    <div className="py-5" style={{background:'linear-gradient(135deg,#e0eafc 0%,#cfdef3 100%)', minHeight:'100vh'}}>
      <div className="container">
        {/* Back Button */}
        <div className="mb-4">
          <button className="btn btn-outline-primary" onClick={() => navigate('/users')}>
            <FaArrowLeft className="me-2" />
            Back to Discovery
          </button>
        </div>

        <div className="row g-4">
          {/* Profile Card */}
          <div className="col-lg-4">
            <div className="bg-white rounded-4 shadow p-4">
              {/* Profile Picture and Basic Info */}
              <div className="text-center mb-4">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.firstName}
                    className="rounded-circle mb-3"
                    style={{width: '120px', height: '120px', objectFit: 'cover'}}
                  />
                ) : (
                  <FaUserCircle size={120} className="text-muted mb-3" />
                )}
                <h3 className="fw-bold mb-1">{user.firstName} {user.lastName}</h3>
                <p className="text-muted mb-2">@{user.username}</p>
                
                {/* Rating */}
                <div className="d-flex align-items-center justify-content-center mb-3">
                  <FaStar className="text-warning me-1" />
                  <span className="fw-bold me-2">{user.rating?.average || 0}</span>
                  <small className="text-muted">({user.rating?.count || 0} reviews)</small>
                </div>

                {/* Location */}
                {user.location && (
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <FaMapMarkerAlt className="text-muted me-2" />
                    <span className="text-muted">{user.location}</span>
                  </div>
                )}

                {/* Swap Request Button */}
                {!isOwnProfile && (
                  <button
                    className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                    onClick={() => setShowSwapModal(true)}
                  >
                    <FaExchangeAlt />
                    Send Swap Request
                  </button>
                )}
              </div>

              {/* Bio */}
              {user.bio && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">About</h6>
                  <p className="text-muted" style={{lineHeight: '1.6'}}>{user.bio}</p>
                </div>
              )}

              {/* Links */}
              {user.links && user.links.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">Links</h6>
                  <div className="d-flex flex-column gap-2">
                    {user.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                      >
                        <FaLink />
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="row text-center">
                <div className="col-4">
                  <div className="fw-bold fs-4 text-primary">{user.skills?.length || 0}</div>
                  <small className="text-muted">Skills</small>
                </div>
                <div className="col-4">
                  <div className="fw-bold fs-4 text-warning">{user.skillsToLearn?.length || 0}</div>
                  <small className="text-muted">Learning</small>
                </div>
                <div className="col-4">
                  <div className="fw-bold fs-4 text-success">{user.rating?.count || 0}</div>
                  <small className="text-muted">Reviews</small>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-lg-8">
            <div className="bg-white rounded-4 shadow p-4">
              {/* Tabs */}
              <div className="d-flex mb-4 gap-2 flex-wrap">
                <button
                  className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`btn ${activeTab === 'skills' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveTab('skills')}
                >
                  Skills
                </button>
                <button
                  className={`btn ${activeTab === 'reviews' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveTab('reviews')}
                >
                  Reviews
                </button>
                <button
                  className={`btn ${activeTab === 'achievements' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveTab('achievements')}
                >
                  Achievements
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div>
                  <h5 className="mb-4">Skills Overview</h5>
                  
                  {/* Skills they can teach */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <FaTools className="text-primary me-2" />
                      <h6 className="mb-0 fw-bold">Skills they can teach</h6>
                    </div>
                    {user.skills && user.skills.length > 0 ? (
                      <div className="d-flex flex-wrap gap-2">
                        {user.skills.map((skill, idx) => (
                          <span key={idx} className="badge bg-primary bg-opacity-10 text-primary p-2">
                            {skill.name}
                            {skill.level && <small className="ms-1">({skill.level})</small>}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No skills added yet</p>
                    )}
                  </div>

                  {/* Skills they want to learn */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <FaLightbulb className="text-warning me-2" />
                      <h6 className="mb-0 fw-bold">Skills they want to learn</h6>
                    </div>
                    {user.skillsToLearn && user.skillsToLearn.length > 0 ? (
                      <div className="d-flex flex-wrap gap-2">
                        {user.skillsToLearn.map((skill, idx) => (
                          <span key={idx} className="badge bg-warning bg-opacity-10 text-warning p-2">
                            {skill.name}
                            {skill.priority && <small className="ms-1">({skill.priority})</small>}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No skills to learn added yet</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'skills' && (
                <div>
                  <h5 className="mb-4">Detailed Skills</h5>
                  
                  {/* Teaching Skills */}
                  <div className="mb-4">
                    <h6 className="fw-bold text-primary mb-3">Teaching Skills</h6>
                    {user.skills && user.skills.length > 0 ? (
                      <div className="row g-3">
                        {user.skills.map((skill, idx) => (
                          <div key={idx} className="col-md-6">
                            <div className="card border-0 bg-light">
                              <div className="card-body">
                                <h6 className="card-title mb-1">{skill.name}</h6>
                                <small className="text-muted">Level: {skill.level}</small>
                                {skill.description && (
                                  <p className="card-text small mt-2">{skill.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No teaching skills added yet</p>
                    )}
                  </div>

                  {/* Learning Skills */}
                  <div>
                    <h6 className="fw-bold text-warning mb-3">Skills to Learn</h6>
                    {user.skillsToLearn && user.skillsToLearn.length > 0 ? (
                      <div className="row g-3">
                        {user.skillsToLearn.map((skill, idx) => (
                          <div key={idx} className="col-md-6">
                            <div className="card border-0 bg-light">
                              <div className="card-body">
                                <h6 className="card-title mb-1">{skill.name}</h6>
                                <small className="text-muted">Priority: {skill.priority}</small>
                                {skill.description && (
                                  <p className="card-text small mt-2">{skill.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No learning skills added yet</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="text-center py-5">
                  <FaStar size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">Reviews coming soon!</h5>
                  <p className="text-muted">This feature will show reviews from other users</p>
                </div>
              )}

              {activeTab === 'achievements' && (
                <div className="text-center py-5">
                  <FaMedal size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">Achievements coming soon!</h5>
                  <p className="text-muted">This feature will show badges and achievements</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Swap Request Modal */}
        {showSwapModal && (
          <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Send Swap Request</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowSwapModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold">What skill will you teach?</label>
                    <select
                      className="form-select"
                      value={swapRequest.skillToTeach}
                      onChange={(e) => setSwapRequest({...swapRequest, skillToTeach: e.target.value})}
                    >
                      <option value="">Select a skill you can teach</option>
                      {teachableSkills.map((skill, idx) => {
                        const name = normalizeSkillName(skill);
                        return name ? <option key={`${name}-${idx}`} value={name}>{name}</option> : null;
                      })}
                    </select>
                    {teachableSkills.length === 0 && (
                      <small className="text-muted">No skills found. Add skills you can teach in your profile.</small>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">What skill do you want to learn?</label>
                    <select
                      className="form-select"
                      value={swapRequest.skillToLearn}
                      onChange={(e) => setSwapRequest({...swapRequest, skillToLearn: e.target.value})}
                    >
                      <option value="">Select a skill you want to learn</option>
                      {learnableSkills.map((skill, idx) => {
                        const name = normalizeSkillName(skill);
                        return name ? <option key={`${name}-${idx}`} value={name}>{name}</option> : null;
                      })}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Message (optional)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Introduce yourself and explain what you'd like to learn..."
                      value={swapRequest.message}
                      onChange={(e) => setSwapRequest({...swapRequest, message: e.target.value})}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowSwapModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSwapRequest}
                    disabled={sendingRequest || !swapRequest.skillToTeach || !swapRequest.skillToLearn}
                  >
                    {sendingRequest ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 