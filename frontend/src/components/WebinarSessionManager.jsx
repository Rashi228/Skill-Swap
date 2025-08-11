import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  Video, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Settings,
  Share2,
  Download,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Star,
  Award,
  FileText,
  Image,
  Link,
  CheckCircle,
  AlertCircle,
  X,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import WebinarAnalytics from './WebinarAnalytics';

const WebinarSessionManager = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [sessions, setSessions] = useState([
    {
      id: 1,
      title: 'React Advanced Workshop',
      description: 'Learn advanced React concepts including hooks, context, and performance optimization',
      date: '2024-01-15',
      time: '14:00',
      duration: '2 hours',
      maxParticipants: 50,
      currentParticipants: 12,
      price: 25,
      currency: 'USD',
      status: 'upcoming',
      category: 'Programming',
      tags: ['react', 'javascript', 'frontend'],
      isPublic: true,
      isRecording: false,
      host: 'John Doe',
      thumbnail: '/thumbnails/react-workshop.jpg'
    },
    {
      id: 2,
      title: 'UI/UX Design Principles',
      description: 'Master the fundamentals of user interface and user experience design',
      date: '2024-01-18',
      time: '10:00',
      duration: '1.5 hours',
      maxParticipants: 30,
      currentParticipants: 8,
      price: 20,
      currency: 'USD',
      status: 'upcoming',
      category: 'Design',
      tags: ['ui', 'ux', 'design'],
      isPublic: true,
      isRecording: false,
      host: 'Sarah Wilson',
      thumbnail: '/thumbnails/design-workshop.jpg'
    },
    {
      id: 3,
      title: 'Python Data Science',
      description: 'Introduction to data science with Python, pandas, and matplotlib',
      date: '2024-01-12',
      time: '16:00',
      duration: '3 hours',
      maxParticipants: 40,
      currentParticipants: 25,
      price: 35,
      currency: 'USD',
      status: 'completed',
      category: 'Programming',
      tags: ['python', 'data-science', 'pandas'],
      isPublic: true,
      isRecording: true,
      host: 'Mike Johnson',
      thumbnail: '/thumbnails/python-workshop.jpg'
    }
  ]);

  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: '1 hour',
    maxParticipants: 50,
    price: 0,
    currency: 'USD',
    category: 'Programming',
    tags: [],
    isPublic: true
  });

  // Load sessions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('webinarSessions');
    if (saved) setSessions(JSON.parse(saved));
  }, []);
  // Save sessions to localStorage on change
  useEffect(() => {
    localStorage.setItem('webinarSessions', JSON.stringify(sessions));
  }, [sessions]);

  // Toast state for 'Session started!'
  const [showToast, setShowToast] = useState(false);
  const handleStartSession = (session) => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // Add state for share/download toasts
  const [toastMsg, setToastMsg] = useState("");

  const handleShareSession = (session) => {
    const url = `${window.location.origin}/webinar/${session.id}`;
    navigator.clipboard.writeText(url);
    setToastMsg("Session link copied to clipboard!");
    setTimeout(() => setToastMsg("") , 2000);
  };

  const handleDownloadSession = (session) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(session, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `${session.title.replace(/\s+/g, '_') || 'session'}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    setToastMsg("Session details downloaded!");
    setTimeout(() => setToastMsg("") , 2000);
  };

  const handleCreateSession = () => {
    const session = {
      id: Date.now(),
      ...newSession,
      status: 'upcoming',
      currentParticipants: 0,
      isRecording: false,
      host: 'You',
      thumbnail: '/thumbnails/default.jpg'
    };
    setSessions([...sessions, session]);
    setShowCreateModal(false);
    setNewSession({
      title: '',
      description: '',
      date: '',
      time: '',
      duration: '1 hour',
      maxParticipants: 50,
      price: 0,
      currency: 'USD',
      category: 'Programming',
      tags: [],
      isPublic: true
    });
  };

  // Overwrite handleEditSession to update all fields
  const handleEditSession = () => {
    const updatedSessions = sessions.map(session => 
      session.id === selectedSession.id ? { ...session, ...newSession } : session
    );
    setSessions(updatedSessions);
    setShowEditModal(false);
    setSelectedSession(null);
  };

  // Overwrite handleDeleteSession to remove from localStorage
  const handleDeleteSession = (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      setSessions(sessions.filter(session => session.id !== sessionId));
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (activeTab === 'upcoming') return session.status === 'upcoming';
    if (activeTab === 'completed') return session.status === 'completed';
    if (activeTab === 'draft') return session.status === 'draft';
    return true;
  });

  const renderCreateModal = () => (
    <div style={{zIndex: 1050, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)'}}>
      <div className="modal show" style={{ display: 'block' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Create New Webinar Session</h5>
              <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
            </div>
            <div className="modal-body">
              <form>
                <div className="mb-3">
                  <label className="form-label">Session Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newSession.title}
                    onChange={(e) => setNewSession({...newSession, title: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={newSession.description}
                    onChange={(e) => setNewSession({...newSession, description: e.target.value})}
                  ></textarea>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newSession.date}
                      onChange={(e) => setNewSession({...newSession, date: e.target.value})}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={newSession.time}
                      onChange={(e) => setNewSession({...newSession, time: e.target.value})}
                    />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Duration</label>
                    <select
                      className="form-control"
                      value={newSession.duration}
                      onChange={(e) => setNewSession({...newSession, duration: e.target.value})}
                    >
                      <option value="30 minutes">30 minutes</option>
                      <option value="1 hour">1 hour</option>
                      <option value="1.5 hours">1.5 hours</option>
                      <option value="2 hours">2 hours</option>
                      <option value="3 hours">3 hours</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Max Participants</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newSession.maxParticipants}
                      onChange={(e) => setNewSession({...newSession, maxParticipants: parseInt(e.target.value)})}
                      min="1"
                      max="100"
                    />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Price</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newSession.price}
                      onChange={(e) => setNewSession({...newSession, price: parseFloat(e.target.value)})}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Currency</label>
                    <select
                      className="form-control"
                      value={newSession.currency}
                      onChange={(e) => setNewSession({...newSession, currency: e.target.value})}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Category</label>
                  <select
                    className="form-control"
                    value={newSession.category}
                    onChange={(e) => setNewSession({...newSession, category: e.target.value})}
                  >
                    <option value="Programming">Programming</option>
                    <option value="Design">Design</option>
                    <option value="Business">Business</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Language">Language</option>
                    <option value="Music">Music</option>
                    <option value="Sports">Sports</option>
                    <option value="Cooking">Cooking</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Tags</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter tags separated by commas"
                    onChange={(e) => setNewSession({...newSession, tags: e.target.value.split(',').map(tag => tag.trim())})}
                  />
                </div>
                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="isPublic"
                    checked={newSession.isPublic}
                    onChange={(e) => setNewSession({...newSession, isPublic: e.target.checked})}
                  />
                  <label className="form-check-label" htmlFor="isPublic">Make session public</label>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleCreateSession}>Create Session</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEditModal = () => (
    <div style={{zIndex: 1050, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)'}}>
      <div className="modal show" style={{ display: 'block' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Session</h5>
              <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
            </div>
            <div className="modal-body">
              <form>
                <div className="mb-3">
                  <label className="form-label">Session Title</label>
                  <input type="text" className="form-control" value={newSession.title} onChange={e => setNewSession({...newSession, title: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows="3" value={newSession.description} onChange={e => setNewSession({...newSession, description: e.target.value})}></textarea>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Date</label>
                    <input type="date" className="form-control" value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Time</label>
                    <input type="time" className="form-control" value={newSession.time} onChange={e => setNewSession({...newSession, time: e.target.value})} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Duration</label>
                    <select className="form-control" value={newSession.duration} onChange={e => setNewSession({...newSession, duration: e.target.value})}>
                      <option value="30 minutes">30 minutes</option>
                      <option value="1 hour">1 hour</option>
                      <option value="1.5 hours">1.5 hours</option>
                      <option value="2 hours">2 hours</option>
                      <option value="3 hours">3 hours</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Max Participants</label>
                    <input type="number" className="form-control" value={newSession.maxParticipants} onChange={e => setNewSession({...newSession, maxParticipants: parseInt(e.target.value)})} min="1" max="100" />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Price</label>
                    <input type="number" className="form-control" value={newSession.price} onChange={e => setNewSession({...newSession, price: parseFloat(e.target.value)})} min="0" step="0.01" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Currency</label>
                    <select className="form-control" value={newSession.currency} onChange={e => setNewSession({...newSession, currency: e.target.value})}>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Category</label>
                  <select className="form-control" value={newSession.category} onChange={e => setNewSession({...newSession, category: e.target.value})}>
                    <option value="Programming">Programming</option>
                    <option value="Design">Design</option>
                    <option value="Business">Business</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Language">Language</option>
                    <option value="Music">Music</option>
                    <option value="Sports">Sports</option>
                    <option value="Cooking">Cooking</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Tags</label>
                  <input type="text" className="form-control" value={newSession.tags.join(', ')} onChange={e => setNewSession({...newSession, tags: e.target.value.split(',').map(tag => tag.trim())})} />
                </div>
                <div className="form-check mb-3">
                  <input type="checkbox" className="form-check-input" id="isPublicEdit" checked={newSession.isPublic} onChange={e => setNewSession({...newSession, isPublic: e.target.checked})} />
                  <label className="form-check-label" htmlFor="isPublicEdit">Make session public</label>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleEditSession}>Update Session</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSessionCard = (session) => (
    <div key={session.id} className="card mb-4 shadow-sm">
      <div className="position-relative">
        <div className="h-100 bg-primary d-flex align-items-center justify-content-center">
          <Video size={48} className="text-white" />
        </div>
        
        {/* Status Badge */}
        <div className="position-absolute top-0 end-0 p-2">
          {session.status === 'upcoming' && (
            <span className="badge bg-primary text-white px-2 py-1 rounded-pill text-xs">
              Upcoming
            </span>
          )}
          {session.status === 'completed' && (
            <span className="badge bg-success text-white px-2 py-1 rounded-pill text-xs">
              Completed
            </span>
          )}
          {session.status === 'draft' && (
            <span className="badge bg-secondary text-white px-2 py-1 rounded-pill text-xs">
              Draft
            </span>
          )}
        </div>

        {/* Recording Badge */}
        {session.isRecording && (
          <div className="position-absolute top-0 start-0 bg-danger text-white px-2 py-1 rounded-pill text-xs d-flex align-items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-circle animate-pulse"></div>
            REC
          </div>
        )}
      </div>

      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="card-title text-dark">{session.title}</h5>
          <div className="d-flex align-items-center gap-1">
            {session.isPublic ? <Unlock size={16} className="text-success" /> : <Lock size={16} className="text-secondary" />}
          </div>
        </div>

        <p className="card-text text-muted text-sm mb-3 line-clamp-2">{session.description}</p>

        <div className="d-flex align-items-center gap-4 text-sm text-muted mb-3">
          <div className="d-flex align-items-center gap-1">
            <Calendar size={14} />
            <span>{session.date}</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <Clock size={14} />
            <span>{session.time}</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <Users size={14} />
            <span>{session.currentParticipants}/{session.maxParticipants}</span>
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <span className="text-sm font-medium text-dark">
              {session.price > 0 ? `${session.currency} ${session.price}` : 'Free'}
            </span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <Star size={14} className="text-warning" />
            <span className="text-sm text-muted">4.8 (12 reviews)</span>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-1 mb-4">
          {session.tags.map((tag, index) => (
            <span key={index} className="badge bg-light text-muted px-2 py-1 rounded-pill text-xs">
              {tag}
            </span>
          ))}
        </div>

        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => handleStartSession(session)}
              className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            >
              <Play size={14} />
              Start
            </button>
            <button
              onClick={() => {
                setSelectedSession(session);
                setNewSession(session);
                setShowEditModal(true);
              }}
              className="btn btn-outline-secondary btn-sm"
            >
              <Edit size={14} />
              Edit
            </button>
          </div>
          
          <div className="d-flex align-items-center gap-1">
            <button className="btn btn-outline-secondary btn-sm p-1 rounded-0" onClick={() => handleShareSession(session)}>
              <Share2 size={16} />
            </button>
            <button className="btn btn-outline-secondary btn-sm p-1 rounded-0" onClick={() => handleDownloadSession(session)}>
              <Download size={16} />
            </button>
            <button
              onClick={() => handleDeleteSession(session.id)}
              className="btn btn-outline-danger btn-sm p-1 rounded-0"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container py-6 mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Webinar Sessions</h1>
          <p className="text-muted">Manage your webinar and workshop sessions</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <button
            onClick={() => setShowAnalytics(true)}
            className="btn btn-success d-flex align-items-center gap-2"
          >
            <BarChart3 size={20} />
            Analytics
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary d-flex align-items-center gap-2"
          >
            <Plus size={20} />
            Create Session
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="nav nav-pills mb-4 gap-2" role="tablist">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`nav-link ${activeTab === 'upcoming' ? 'active btn btn-primary text-white' : 'btn btn-outline-primary'}`}
        >
          Upcoming ({sessions.filter(s => s.status === 'upcoming').length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`nav-link ${activeTab === 'completed' ? 'active btn btn-success text-white' : 'btn btn-outline-success'}`}
        >
          Completed ({sessions.filter(s => s.status === 'completed').length})
        </button>
        <button
          onClick={() => setActiveTab('draft')}
          className={`nav-link ${activeTab === 'draft' ? 'active btn btn-secondary text-white' : 'btn btn-outline-secondary'}`}
        >
          Drafts ({sessions.filter(s => s.status === 'draft').length})
        </button>
      </div>

      {/* Sessions Grid */}
      <div className="row g-3 mb-4">
        {filteredSessions.map(renderSessionCard)}
      </div>

      {/* Empty State */}
      {filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <Video size={48} className="mx-auto text-muted mb-4" />
          <h3 className="text-lg font-medium text-dark mb-2">No {activeTab} sessions</h3>
          <p className="text-muted mb-4">
            {activeTab === 'upcoming' && "You don't have any upcoming sessions scheduled."}
            {activeTab === 'completed' && "You haven't completed any sessions yet."}
            {activeTab === 'draft' && "You don't have any draft sessions."}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary d-flex align-items-center gap-2 mx-auto"
          >
            <Plus size={20} />
            Create Your First Session
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && renderCreateModal()}

      {/* Edit Modal */}
      {showEditModal && selectedSession && renderEditModal()}

      {/* Analytics Modal */}
      {showAnalytics && (
        <div style={{zIndex: 1050, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal show" style={{ display: 'block' }}>
            <div className="modal-dialog modal-xl">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Webinar Analytics</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAnalytics(false)}></button>
                </div>
                <div className="modal-body">
                  <WebinarAnalytics />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showToast && (
        <div style={{position: 'fixed', bottom: 30, right: 30, zIndex: 2000}} className="alert alert-success shadow">
          Session started!
        </div>
      )}
      {toastMsg && (
        <div style={{position: 'fixed', bottom: 80, right: 30, zIndex: 2000}} className="alert alert-info shadow">
          {toastMsg}
        </div>
      )}
    </div>
  );
};

export default WebinarSessionManager; 