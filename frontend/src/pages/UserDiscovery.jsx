import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaStar, FaTools, FaLightbulb, FaMapMarkerAlt, FaUserCircle, FaEye, FaExchangeAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import userService from '../services/userService';

const UserDiscovery = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { emitSwapRequest, socket } = useSocket();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Load users
  useEffect(() => {
    loadUsers();
  }, [token, currentPage, search, skillFilter, locationFilter]);

  // Listen for real-time user status updates
  useEffect(() => {
    if (!socket) return;

    const handleUserStatusChange = (data) => {
      console.log('User status changed:', data);
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === data.userId 
            ? { ...user, isOnline: data.status === 'online' }
            : user
        )
      );
    };

    const handleUserProfileUpdate = (data) => {
      console.log('User profile updated:', data);
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === data.userId 
            ? { ...user, ...data.profile }
            : user
        )
      );
    };

    socket.on('user_status_changed', handleUserStatusChange);
    socket.on('user_profile_updated', handleUserProfileUpdate);

    return () => {
      socket.off('user_status_changed', handleUserStatusChange);
      socket.off('user_profile_updated', handleUserProfileUpdate);
    };
  }, [socket]);

  const loadUsers = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12'
      });
      
      if (search) params.append('search', search);
      if (skillFilter) params.append('skill', skillFilter);
      if (locationFilter) params.append('location', locationFilter);

      const result = await userService.getAllUsers(token, params);
      
      if (result.success) {
        setUsers(result.users);
        setTotalPages(result.pagination.pages);
        setTotalUsers(result.pagination.total);
      } else {
        setError('Failed to load users');
      }
    } catch (error) {
      setError('Error loading users');
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleSkillFilter = (e) => {
    setSkillFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleLocationFilter = (e) => {
    setLocationFilter(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSkillFilter('');
    setLocationFilter('');
    setCurrentPage(1);
  };

  const viewUserProfile = (userId) => {
    navigate(`/user/${userId}`);
  };

  const sendSwapRequest = (userId) => {
    navigate(`/user/${userId}`, { state: { openSwapModal: true } });
  };

  if (loading && users.length === 0) {
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
          <h1 className="fw-bold mb-3" style={{color:'#185a9d'}}>Discover Skill Swappers</h1>
          <p className="text-secondary">Find people to swap skills with and grow together!</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-4 shadow p-4 mb-4">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <FaSearch className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by name or username..."
                  value={search}
                  onChange={handleSearch}
                />
              </div>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter />
                Filters
              </button>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={clearFilters}
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="row g-3 mt-3 pt-3 border-top">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filter by skill (e.g., JavaScript, Cooking)"
                  value={skillFilter}
                  onChange={handleSkillFilter}
                />
              </div>
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filter by location"
                  value={locationFilter}
                  onChange={handleLocationFilter}
                />
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="text-secondary">
            Showing {users.length} of {totalUsers} users
          </div>
          <div className="text-secondary">
            Page {currentPage} of {totalPages}
          </div>
        </div>

        {/* Users Grid */}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {users.length === 0 && !loading ? (
          <div className="text-center py-5">
            <FaUserCircle size={64} className="text-muted mb-3" />
            <h5 className="text-muted">No users found</h5>
            <p className="text-muted">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="row g-4">
            {users.map(user => (
              <div key={user._id} className="col-lg-4 col-md-6">
                <div className="card h-100 border-0 shadow-sm hover-lift">
                  <div className="card-body p-4">
                    {/* User Header */}
                    <div className="d-flex align-items-center mb-3">
                      <div className="me-3">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.firstName}
                            className="rounded-circle"
                            style={{width: '60px', height: '60px', objectFit: 'cover'}}
                          />
                        ) : (
                          <FaUserCircle size={60} className="text-muted" />
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-1 fw-bold">{user.firstName} {user.lastName}</h6>
                        <small className="text-muted">@{user.username}</small>
                        {user.location && (
                          <div className="d-flex align-items-center mt-1">
                            <FaMapMarkerAlt size={12} className="text-muted me-1" />
                            <small className="text-muted">{user.location}</small>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="d-flex align-items-center mb-3">
                      <FaStar className="text-warning me-1" />
                      <span className="fw-bold me-2">{user.rating?.average || 0}</span>
                      <small className="text-muted">({user.rating?.count || 0} reviews)</small>
                    </div>

                    {/* Bio */}
                    {user.bio && (
                      <p className="text-muted small mb-3" style={{lineHeight: '1.4'}}>
                        {user.bio.length > 100 ? `${user.bio.substring(0, 100)}...` : user.bio}
                      </p>
                    )}

                    {/* Skills */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <FaTools size={14} className="text-primary me-2" />
                        <small className="fw-bold text-primary">Can Teach</small>
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        {user.skills?.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="badge bg-primary bg-opacity-10 text-primary">
                            {skill.name}
                          </span>
                        ))}
                        {user.skills?.length > 3 && (
                          <span className="badge bg-secondary bg-opacity-10 text-secondary">
                            +{user.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Skills to Learn */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <FaLightbulb size={14} className="text-warning me-2" />
                        <small className="fw-bold text-warning">Wants to Learn</small>
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        {user.skillsToLearn?.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="badge bg-warning bg-opacity-10 text-warning">
                            {skill.name}
                          </span>
                        ))}
                        {user.skillsToLearn?.length > 3 && (
                          <span className="badge bg-secondary bg-opacity-10 text-secondary">
                            +{user.skillsToLearn.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex gap-2 mt-auto">
                      <button
                        className="btn btn-outline-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                        onClick={() => viewUserProfile(user._id)}
                      >
                        <FaEye />
                        View Profile
                      </button>
                      <button
                        className="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                        onClick={() => sendSwapRequest(user._id)}
                      >
                        <FaExchangeAlt />
                        Swap Request
                      </button>
                    </div>
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
      </div>
    </div>
  );
};

export default UserDiscovery; 