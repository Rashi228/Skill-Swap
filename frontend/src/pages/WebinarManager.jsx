import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaUsers, FaCalendar, FaClock, FaEye, FaPlay, FaPause, FaStop } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import webinarService from '../services/webinarService';

const WebinarManager = () => {
  const { token } = useAuth();
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [webinarForm, setWebinarForm] = useState({
    title: '',
    description: '',
    topic: '',
    scheduledDate: '',
    duration: 60,
    maxParticipants: 50,
    tags: [],
    isPublic: true,
    price: 0
  });

  useEffect(() => {
    loadMyWebinars();
  }, []);

  const loadMyWebinars = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await webinarService.getMyWebinars(token);
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

  const handleCreateWebinar = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await webinarService.createWebinar(token, webinarForm);
      if (response.success) {
        setSuccess('Webinar created successfully!');
        setShowCreateModal(false);
        setWebinarForm({
          title: '',
          description: '',
          topic: '',
          scheduledDate: '',
          duration: 60,
          maxParticipants: 50,
          tags: [],
          isPublic: true,
          price: 0
        });
        loadMyWebinars();
      } else {
        setError(response.error);
      }
    } catch (error) {
      setError('Failed to create webinar');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (webinarId, newStatus) => {
    if (!token) return;
    
    try {
      const response = await webinarService.updateWebinarStatus(token, webinarId, newStatus);
      if (response.success) {
        setSuccess(`Webinar status updated to ${newStatus}`);
        loadMyWebinars();
      } else {
        setError(response.error);
      }
    } catch (error) {
      setError('Failed to update webinar status');
    }
  };

  const handleDeleteWebinar = async (webinarId) => {
    if (!token) return;
    
    if (!window.confirm('Are you sure you want to delete this webinar?')) {
      return;
    }
    
    try {
      const response = await webinarService.deleteWebinar(token, webinarId);
      if (response.success) {
        setSuccess('Webinar deleted successfully');
        loadMyWebinars();
      } else {
        setError(response.error);
      }
    } catch (error) {
      setError('Failed to delete webinar');
    }
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'upcoming': return <FaCalendar className="text-primary" />;
      case 'live': return <FaPlay className="text-success" />;
      case 'completed': return <FaStop className="text-secondary" />;
      case 'cancelled': return <FaPause className="text-danger" />;
      default: return <FaEye className="text-muted" />;
    }
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
              <h2 className="fw-bold" style={{color: '#185a9d'}}>Webinar Manager</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <FaPlus className="me-2" />
                Create New Webinar
              </button>
            </div>

            {/* Create Webinar Modal */}
            {showCreateModal && (
              <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                <div className="modal-dialog modal-lg">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Create New Webinar</h5>
                      <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => setShowCreateModal(false)}
                      ></button>
                    </div>
                    <div className="modal-body">
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Title *</label>
                          <input 
                            type="text" 
                            className="form-control"
                            value={webinarForm.title}
                            onChange={(e) => setWebinarForm({...webinarForm, title: e.target.value})}
                            placeholder="Enter webinar title"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Topic *</label>
                          <input 
                            type="text" 
                            className="form-control"
                            value={webinarForm.topic}
                            onChange={(e) => setWebinarForm({...webinarForm, topic: e.target.value})}
                            placeholder="e.g., JavaScript, Design, Marketing"
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description *</label>
                        <textarea 
                          className="form-control"
                          rows="3"
                          value={webinarForm.description}
                          onChange={(e) => setWebinarForm({...webinarForm, description: e.target.value})}
                          placeholder="Describe what participants will learn..."
                        />
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Scheduled Date & Time *</label>
                          <input 
                            type="datetime-local" 
                            className="form-control"
                            value={webinarForm.scheduledDate}
                            onChange={(e) => setWebinarForm({...webinarForm, scheduledDate: e.target.value})}
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Duration (minutes) *</label>
                          <input 
                            type="number" 
                            className="form-control"
                            value={webinarForm.duration}
                            onChange={(e) => setWebinarForm({...webinarForm, duration: parseInt(e.target.value)})}
                            min="15"
                            max="480"
                          />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Max Participants</label>
                          <input 
                            type="number" 
                            className="form-control"
                            value={webinarForm.maxParticipants}
                            onChange={(e) => setWebinarForm({...webinarForm, maxParticipants: parseInt(e.target.value)})}
                            min="1"
                            max="1000"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Price (0 = Free)</label>
                          <input 
                            type="number" 
                            className="form-control"
                            value={webinarForm.price}
                            onChange={(e) => setWebinarForm({...webinarForm, price: parseFloat(e.target.value)})}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="form-check">
                          <input 
                            className="form-check-input"
                            type="checkbox"
                            checked={webinarForm.isPublic}
                            onChange={(e) => setWebinarForm({...webinarForm, isPublic: e.target.checked})}
                          />
                          <label className="form-check-label">
                            Make this webinar public
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => setShowCreateModal(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-primary"
                        onClick={handleCreateWebinar}
                        disabled={loading || !webinarForm.title || !webinarForm.description || !webinarForm.topic || !webinarForm.scheduledDate}
                      >
                        {loading ? 'Creating...' : 'Create Webinar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Webinars List */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : webinars.length === 0 ? (
              <div className="text-center py-5">
                <FaCalendar size={64} className="text-muted mb-3" />
                <h4 className="text-muted">No webinars yet</h4>
                <p className="text-muted">Create your first webinar to get started!</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <FaPlus className="me-2" />
                  Create Webinar
                </button>
              </div>
            ) : (
              <div className="row g-4">
                {webinars.map(webinar => (
                  <div key={webinar._id} className="col-lg-6">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="d-flex align-items-center">
                            {getStatusIcon(webinar.status)}
                            <span className={`badge ms-2 ${webinar.status === 'upcoming' ? 'bg-primary' : webinar.status === 'live' ? 'bg-success' : webinar.status === 'completed' ? 'bg-secondary' : 'bg-danger'}`}>
                              {webinar.status}
                            </span>
                          </div>
                          <div className="dropdown">
                            <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                              Actions
                            </button>
                            <ul className="dropdown-menu">
                              <li><button className="dropdown-item" onClick={() => handleUpdateStatus(webinar._id, 'live')}>Start Live</button></li>
                              <li><button className="dropdown-item" onClick={() => handleUpdateStatus(webinar._id, 'completed')}>Mark Complete</button></li>
                              <li><button className="dropdown-item" onClick={() => handleUpdateStatus(webinar._id, 'cancelled')}>Cancel</button></li>
                              <li><hr className="dropdown-divider" /></li>
                              <li><button className="dropdown-item text-danger" onClick={() => handleDeleteWebinar(webinar._id)}>Delete</button></li>
                            </ul>
                          </div>
                        </div>
                        
                        <h5 className="card-title mb-2">{webinar.title}</h5>
                        <p className="card-text text-secondary mb-3">{webinar.description}</p>
                        
                        <div className="row mb-3">
                          <div className="col-6">
                            <small className="text-muted d-block">
                              <FaCalendar className="me-1" />
                              {formatDate(webinar.scheduledDate)}
                            </small>
                          </div>
                          <div className="col-6">
                            <small className="text-muted d-block">
                              <FaClock className="me-1" />
                              {webinar.duration} minutes
                            </small>
                          </div>
                        </div>
                        
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <FaUsers className="text-muted me-1" />
                            <small className="text-muted">
                              {webinar.currentParticipants}/{webinar.maxParticipants} participants
                            </small>
                          </div>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-primary">
                              <FaEdit className="me-1" />
                              Edit
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteWebinar(webinar._id)}
                            >
                              <FaTrash className="me-1" />
                              Delete
                            </button>
                          </div>
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
    </div>
  );
};

export default WebinarManager; 