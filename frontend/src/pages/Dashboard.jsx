import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaEdit, FaSave, FaTools, FaLightbulb, FaWallet, FaCalendarAlt, FaStar, FaCamera, FaMedal, FaShareAlt, FaCog, FaLink, FaCopy, FaBell, FaCheckCircle, FaExchangeAlt, FaComments, FaPlus, FaTrash, FaTimes, FaClock } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import userService from '../services/userService';
import NotificationService from '../services/notificationService';
import referralService from '../services/referralService';
import webinarService from '../services/webinarService';
import ReviewService from '../services/reviewService';
import AchievementService from '../services/achievementService';
import Calendar from '../components/Calendar';
import ReviewForm from '../components/ReviewForm';

const tabList = [
  { key: 'skills', label: 'My Skills', icon: <FaTools /> },
  { key: 'wants', label: 'Skills I Want', icon: <FaLightbulb /> },
  { key: 'links', label: 'My Links', icon: <FaLink /> },
  { key: 'wallet', label: 'My Time Balance', icon: <FaWallet /> },
  { key: 'webinars', label: 'Webinars', icon: <FaCamera /> },
  { key: 'reputation', label: 'Reputation', icon: <FaStar /> },
  { key: 'badges', label: 'Achievements', icon: <FaMedal /> },
  { key: 'referral', label: 'Invite Friends', icon: <FaShareAlt /> },
  { key: 'calendar', label: 'Calendar', icon: <FaCalendarAlt /> },
  // { key: 'settings', label: 'Settings', icon: <FaCog /> },
  { key: 'notifications', label: 'Notifications', icon: <FaBell /> },
];

const Dashboard = () => {
  const location = useLocation();
  const { user: authUser, token, fetchUnreadCount } = useAuth();
  const { socket } = useSocket();
  
  // User data state - starts empty
  const [user, setUser] = useState({
    name: authUser ? `${authUser.firstName} ${authUser.lastName}` : '',
    bio: '',
    city: '',
    age: '',
    language: '',
    profilePic: '',
    skills: [],
    wants: [],
    timeBalance: 0,
    swaps: [],
    reputation: 0,
    reviews: 0,
    badges: [],
    achievements: {
      badges: [],
      totalBadges: 0,
      level: 1,
      experience: 0
    },
    referral: `https://skillswap.com/invite/${authUser?.username || 'user'}`,
    links: [],
    projects: [],
    notifications: []
  });

  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    bio: '',
    city: '',
    age: '',
    language: '',
    profilePic: '',
    links: []
  });
  const [activeTab, setActiveTab] = useState('skills');
  const [profilePicPreview, setProfilePicPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [calendarSwaps, setCalendarSwaps] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [referralStats, setReferralStats] = useState({
    referralCode: '',
    referralStats: {
      totalReferrals: 0,
      successfulReferrals: 0,
      creditsEarned: 0
    }
  });
  const [referralLoading, setReferralLoading] = useState(false);
  const [myWebinars, setMyWebinars] = useState([]);
  const [webinarsLoading, setWebinarsLoading] = useState(false);
  const [showCreateWebinar, setShowCreateWebinar] = useState(false);
  const [editingWebinarId, setEditingWebinarId] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedUserForReview, setSelectedUserForReview] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
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



  // Load notifications
  const loadNotifications = async () => {
    if (token) {
      try {
        setNotificationsLoading(true);
        const response = await NotificationService.getNotifications(token);
        const safeList = Array.isArray(response.notifications) ? response.notifications : [];
        setNotifications(safeList);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      } finally {
        setNotificationsLoading(false);
      }
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    if (token) {
      try {
        await NotificationService.markAsRead(token, notificationId);
        // Update local state
        setNotifications(prev => prev.map(n => 
          n._id === notificationId ? { ...n, isRead: true } : n
        ));
        // Refresh unread count
        fetchUnreadCount();
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  // Delete notification
  const handleDeleteNotification = async (notificationId) => {
    if (token) {
      try {
        await NotificationService.deleteNotification(token, notificationId);
        // Remove from local state
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        // Refresh unread count
        fetchUnreadCount();
      } catch (error) {
        console.error('Failed to delete notification:', error);
      }
    }
  };

  // Load user data from backend on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (authUser && token) {
        try {
          setLoading(true);
          const result = await userService.getCurrentUser(token);
          if (result.success) {
            const backendUser = result.user;
            setUser({
              name: `${backendUser.firstName} ${backendUser.lastName}`,
              bio: backendUser.bio || '',
              city: backendUser.location || '',
              age: backendUser.age || '',
              language: backendUser.language || '',
              profilePic: backendUser.profilePicture || '',
              skills: backendUser.skills.map(skill => skill.name),
              wants: backendUser.skillsToLearn.map(skill => skill.name),
              timeBalance: backendUser.wallet?.balance || 0,
              swaps: [],
              reputation: backendUser.rating?.average || 0,
              reviews: backendUser.rating?.count || 0,
              badges: backendUser.achievements?.badges || [],
              achievements: backendUser.achievements || {
                badges: [],
                totalBadges: 0,
                level: 1,
                experience: 0
              },
              referral: `https://skillswap.com/invite/${backendUser.username}`,
              links: backendUser.links || [],
              projects: [],
              notifications: []
            });
            setProfileForm({
              name: `${backendUser.firstName} ${backendUser.lastName}`,
              bio: backendUser.bio || '',
              city: backendUser.location || '',
              age: backendUser.age || '',
              language: backendUser.language || '',
              profilePic: backendUser.profilePicture || '',
              links: backendUser.links || []
            });
            setProfilePicPreview(backendUser.profilePicture || '');
          } else {
            setError('Failed to load user data');
          }
        } catch (error) {
          setError('Error loading user data');
          console.error('Error loading user data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadUserData();
  }, [authUser, token]);

  useEffect(() => {
    if (location.state && location.state.openTab) {
      setActiveTab(location.state.openTab);
    }
  }, [location.state]);

  // Load notifications when notifications tab is active
  useEffect(() => {
    if (activeTab === 'notifications') {
      loadNotifications();
    }
  }, [activeTab]);

  // Load calendar events when calendar tab is active
  useEffect(() => {
    if (activeTab === 'calendar') {
      loadCalendarEvents();
    }
  }, [activeTab]);

  // Load achievements when badges tab is active
  useEffect(() => {
    if (activeTab === 'badges') {
      loadAchievements();
    }
  }, [activeTab]);

  // Load reviews when reputation tab is active
  useEffect(() => {
    if (activeTab === 'reputation') {
      loadUserReviews();
      // Also refresh user data to get latest reputation
      refreshUserData();
    }
  }, [activeTab]);

  // Load referral stats when referral tab is active
  useEffect(() => {
    if (activeTab === 'referral') {
      loadReferralStats();
    }
    if (activeTab === 'webinars') {
      loadMyWebinars();
    }
  }, [activeTab]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for profile updates
    const handleProfileUpdate = (data) => {
      console.log('Profile updated in real-time:', data);
      if (data.userId === authUser?._id) {
        setUser(prevUser => ({
          ...prevUser,
          name: `${data.profile.firstName} ${data.profile.lastName}`,
          bio: data.profile.bio || '',
          city: data.profile.location || '',
          age: data.profile.age || '',
          language: data.profile.language || '',
          profilePic: data.profile.profilePicture || '',
          skills: data.profile.skills?.map(skill => skill.name) || [],
          wants: data.profile.skillsToLearn?.map(skill => skill.name) || [],
          timeBalance: data.profile.wallet?.balance || 0,
          reputation: data.profile.rating?.average || 0,
          reviews: data.profile.rating?.count || 0,
          badges: data.profile.achievements?.badges || [],
          achievements: data.profile.achievements || prevUser.achievements,
          links: data.profile.links || []
        }));
        setSuccess('Profile updated in real-time!');
        setTimeout(() => setSuccess(''), 3000);
      }
    };

    // Listen for new achievements
    const handleNewAchievement = (data) => {
      console.log('New achievement earned:', data);
      
      // Update user achievements
      if (data.newAchievements && data.newAchievements.length > 0) {
        setUser(prevUser => ({
          ...prevUser,
          achievements: {
            ...prevUser.achievements,
            badges: [...(prevUser.achievements?.badges || []), ...data.newAchievements],
            totalBadges: data.totalBadges,
            level: data.level,
            experience: data.experience
          }
        }));
        
        // Show success message for each new achievement
        const achievementNames = data.newAchievements.map(a => a.name).join(', ');
        setSuccess(`🎉 New achievements earned: ${achievementNames}!`);
        setTimeout(() => setSuccess(''), 5000);
      } else if (data.newAchievement) {
        setUser(prevUser => ({
          ...prevUser,
          achievements: {
            ...prevUser.achievements,
            badges: [...(prevUser.achievements?.badges || []), data.newAchievement],
            totalBadges: data.totalBadges,
            level: data.level,
            experience: data.experience
          }
        }));
        
        setSuccess(`🎉 New achievement earned: ${data.newAchievement.name}!`);
        setTimeout(() => setSuccess(''), 5000);
      }
    };

    // Listen for calendar updates
    const handleCalendarUpdate = (data) => {
      console.log('Calendar updated in real-time:', data);
      setCalendarSwaps(data.swaps || []);
      setSuccess('Calendar updated in real-time!');
      setTimeout(() => setSuccess(''), 3000);
    };

    // Listen for wallet updates
    const handleWalletUpdate = (data) => {
      console.log('Wallet updated in real-time:', data);
      setUser(prevUser => ({
        ...prevUser,
        timeBalance: data.balance
      }));
      setSuccess('Wallet balance updated in real-time!');
      setTimeout(() => setSuccess(''), 3000);
    };

    socket.on('user_profile_updated', handleProfileUpdate);
    socket.on('new_achievement', handleNewAchievement);
    socket.on('calendar_data_updated', handleCalendarUpdate);
    socket.on('wallet_balance_updated', handleWalletUpdate);

    return () => {
      socket.off('user_profile_updated', handleProfileUpdate);
      socket.off('new_achievement', handleNewAchievement);
      socket.off('calendar_data_updated', handleCalendarUpdate);
      socket.off('wallet_balance_updated', handleWalletUpdate);
    };
  }, [socket, authUser]);



  // Load calendar events
  const loadCalendarEvents = async () => {
    if (token) {
      try {
        setCalendarLoading(true);
        const currentDate = new Date();
        const result = await userService.getCalendarEvents(token, currentDate.getMonth() + 1, currentDate.getFullYear());
        if (result.success) {
          setCalendarSwaps(result.swaps);
        }
      } catch (error) {
        console.error('Failed to load calendar events:', error);
      } finally {
        setCalendarLoading(false);
      }
    }
  };

  // Load referral statistics
  const loadReferralStats = async () => {
    if (token) {
      try {
        setReferralLoading(true);
        const response = await referralService.getReferralStats(token);
        if (response.success) {
          setReferralStats(response);
        }
      } catch (error) {
        console.error('Failed to load referral stats:', error);
      } finally {
        setReferralLoading(false);
      }
    }
  };

  const loadMyWebinars = async () => {
    if (token) {
      try {
        setWebinarsLoading(true);
        const response = await webinarService.getMyWebinars(token);
        if (response.success) {
          setMyWebinars(response.webinars);
        }
      } catch (error) {
        console.error('Failed to load my webinars:', error);
      } finally {
        setWebinarsLoading(false);
      }
    }
  };

  // Load user reviews
  const loadUserReviews = async () => {
    if (token && authUser) {
      try {
        setReviewsLoading(true);
        const response = await ReviewService.getUserReviews(authUser._id);
        if (response.success) {
          setUserReviews(response.reviews);
        }
      } catch (error) {
        console.error('Failed to load user reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    }
  };

  // Calculate rating breakdown from actual reviews
  const calculateRatingBreakdown = () => {
    if (!userReviews || userReviews.length === 0) {
      return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    }

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    userReviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        breakdown[review.rating]++;
      }
    });

    // Calculate percentages
    const total = userReviews.length;
    const percentages = {};
    Object.keys(breakdown).forEach(rating => {
      percentages[rating] = Math.round((breakdown[rating] / total) * 100);
    });

    return { breakdown, percentages };
  };

  // Refresh user data to get latest reputation
  const refreshUserData = async () => {
    if (token && authUser) {
      try {
        console.log('refreshUserData: Starting refresh...');
        const result = await userService.getCurrentUser(token);
        if (result.success) {
          const backendUser = result.user;
          console.log('refreshUserData: Backend user rating data:', backendUser.rating);
          const newReputation = backendUser.rating?.average || 0;
          const newReviews = backendUser.rating?.count || 0;
          console.log('refreshUserData: Setting reputation to:', newReputation, 'reviews to:', newReviews);
          setUser(prevUser => {
            console.log('refreshUserData: Previous user state:', prevUser.reputation, prevUser.reviews);
            const updatedUser = {
              ...prevUser,
              reputation: newReputation,
              reviews: newReviews
            };
            console.log('refreshUserData: Updated user state:', updatedUser.reputation, updatedUser.reviews);
            return updatedUser;
          });
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  // Load achievements
  const loadAchievements = async () => {
    if (token) {
      try {
        const result = await AchievementService.getUserAchievements(token);
        if (result.success) {
          setUser(prev => ({
            ...prev,
            achievements: result.achievements,
            badges: result.achievements.badges
          }));
        }
      } catch (error) {
        console.error('Failed to load achievements:', error);
      }
    }
  };



  // Handle adding calendar event
  const handleAddCalendarEvent = async (eventData) => {
    if (token) {
      try {
        // For now, we'll just show a success message
        // In a real implementation, this would create a new swap or schedule an existing one
        setSuccess('Event added to calendar!');
        setTimeout(() => setSuccess(''), 3000);
        
        // Reload calendar events
        await loadCalendarEvents();
      } catch (error) {
        console.error('Failed to add calendar event:', error);
        setError('Failed to add event to calendar');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  // Handlers
  const handleProfileChange = e => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleProfileSave = async () => {
    if (!token) return;
    
    try {
      setSaving(true);
      setError('');
      
      const profileData = {
        firstName: profileForm.name.split(' ')[0] || authUser.firstName,
        lastName: profileForm.name.split(' ').slice(1).join(' ') || authUser.lastName,
        bio: profileForm.bio,
        location: profileForm.city,
        profilePicture: profilePicPreview,
        links: profileForm.links
      };

      const result = await userService.updateProfile(token, profileData);
      
             if (result.success) {
         // Update user state with the response from backend
         setUser({ 
           ...user, 
           ...profileForm, 
           profilePic: profilePicPreview,
           links: result.user.links || profileForm.links
         });
         setEditProfile(false);
         setSuccess('Profile updated successfully!');
         setTimeout(() => setSuccess(''), 3000);
       } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Error updating profile');
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSkillChange = (idx, value) => {
    const newSkills = [...user.skills];
    newSkills[idx] = value;
    setUser({ ...user, skills: newSkills });
  };

  const handleAddSkill = () => {
    setUser({ ...user, skills: [...user.skills, ''] });
  };

  const handleRemoveSkill = (idx) => {
    const newSkills = user.skills.filter((_, i) => i !== idx);
    setUser({ ...user, skills: newSkills });
  };

  const handleSaveSkills = async () => {
    if (!token) return;
    
    try {
      setSaving(true);
      setError('');
      
      const skillsData = {
        skills: user.skills.filter(skill => skill.trim() !== '').map(skill => ({
          name: skill.trim(),
          level: 'beginner'
        })),
        skillsToLearn: user.wants.filter(want => want.trim() !== '').map(want => ({
          name: want.trim(),
          priority: 'medium'
        }))
      };

      const result = await userService.updateSkills(token, skillsData);
      
             if (result.success) {
         setSuccess('Skills updated successfully!');
         setTimeout(() => setSuccess(''), 3000);
       } else {
        setError(result.error || 'Failed to update skills');
      }
    } catch (error) {
      setError('Error updating skills');
      console.error('Error updating skills:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleWantChange = (idx, value) => {
    const newWants = [...user.wants];
    newWants[idx] = value;
    setUser({ ...user, wants: newWants });
  };

  const handleAddWant = () => {
    setUser({ ...user, wants: [...user.wants, ''] });
  };

  const handleRemoveWant = (idx) => {
    const newWants = user.wants.filter((_, i) => i !== idx);
    setUser({ ...user, wants: newWants });
  };

  // Links management
  const handleLinkChange = (idx, field, value) => {
    const newLinks = [...profileForm.links];
    newLinks[idx] = { ...newLinks[idx], [field]: value };
    setProfileForm({ ...profileForm, links: newLinks });
  };

  const handleAddLink = () => {
    setProfileForm({
      ...profileForm,
      links: [...profileForm.links, { label: '', url: '' }]
    });
  };

  const handleRemoveLink = (idx) => {
    const newLinks = profileForm.links.filter((_, i) => i !== idx);
    setProfileForm({ ...profileForm, links: newLinks });
  };

  const handleWebinarFormChange = (field, value) => {
    setWebinarForm({ ...webinarForm, [field]: value });
  };

  const handleCreateWebinar = async () => {
    if (!token) return;
    
    try {
      setSaving(true);
      
      // Ensure date is properly formatted
      const formData = {
        ...webinarForm,
        scheduledDate: new Date(webinarForm.scheduledDate).toISOString()
      };
      
      let response;
      
      if (editingWebinarId) {
        // Update existing webinar
        console.log('Updating webinar with data:', formData);
        response = await webinarService.updateWebinar(token, editingWebinarId, formData);
        console.log('Webinar update response:', response);
      } else {
        // Create new webinar
        console.log('Creating webinar with data:', formData);
        response = await webinarService.createWebinar(token, formData);
        console.log('Webinar creation response:', response);
      }
      
      if (response.success) {
        setSuccess(editingWebinarId ? 'Webinar updated successfully!' : 'Webinar created successfully!');
        setShowCreateWebinar(false);
        setEditingWebinarId(null);
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
        setError(response.error || (editingWebinarId ? 'Failed to update webinar' : 'Failed to create webinar'));
      }
    } catch (error) {
      console.error('Webinar operation error:', error);
      setError((editingWebinarId ? 'Failed to update webinar: ' : 'Failed to create webinar: ') + error.message);
    } finally {
      setSaving(false);
    }
  };



  const handleEditWebinar = async (webinarId) => {
    // Find the webinar to edit
    const webinarToEdit = myWebinars.find(w => w._id === webinarId);
    if (webinarToEdit) {
      setWebinarForm({
        title: webinarToEdit.title,
        description: webinarToEdit.description,
        topic: webinarToEdit.topic,
        scheduledDate: new Date(webinarToEdit.scheduledDate).toISOString().slice(0, 16),
        duration: webinarToEdit.duration,
        maxParticipants: webinarToEdit.maxParticipants,
        tags: webinarToEdit.tags || [],
        isPublic: webinarToEdit.isPublic,
        price: webinarToEdit.price
      });
      setShowCreateWebinar(true);
      // Store the webinar ID for editing
      setEditingWebinarId(webinarId);
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
        setSuccess('Webinar deleted successfully!');
        loadMyWebinars();
      } else {
        setError(response.error);
      }
    } catch (error) {
      setError('Failed to delete webinar');
    }
  };

  const handleProfilePicChange = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result);
        setProfileForm({ ...profileForm, profilePic: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-bg min-vh-100 py-5" style={{background:'linear-gradient(135deg,#e0eafc 0%,#cfdef3 100%)'}}>
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
        
        <div className="row g-4">
          {/* Profile Section */}
          <div className="col-lg-4">
            <div className="p-4 rounded-4 shadow-lg profile-section" style={{background:'linear-gradient(135deg,#43cea2 0%,#185a9d 100%)', color:'#fff'}}>
              <div className="text-center mb-3 position-relative">
                {profilePicPreview ? (
                  <img src={profilePicPreview} alt="Profile" className="rounded-circle mb-2" style={{width:'100px',height:'100px',objectFit:'cover',border:'3px solid #fff'}} />
                ) : (
                  <FaUserCircle size={100} className="mb-2" />
                )}
                {editProfile && (
                  <label htmlFor="profilePicInput" className="position-absolute" style={{bottom:'10px',right:'calc(50% - 30px)',cursor:'pointer',background:'#fff',borderRadius:'50%',padding:'6px',boxShadow:'0 2px 8px rgba(24,90,157,0.10)'}}>
                    <FaCamera size={20} color="#185a9d" />
                    <input id="profilePicInput" type="file" accept="image/*" style={{display:'none'}} onChange={handleProfilePicChange} />
                  </label>
                )}
              </div>
              {editProfile ? (
                <>
                  <input className="form-control mb-2" name="name" value={profileForm.name} onChange={handleProfileChange} placeholder="Name" />
                  <textarea className="form-control mb-2" name="bio" value={profileForm.bio} onChange={handleProfileChange} placeholder="Tell us about yourself..." />
                  <input className="form-control mb-2" name="city" value={profileForm.city} onChange={handleProfileChange} placeholder="City" />
                  <input className="form-control mb-2" name="age" value={profileForm.age} onChange={handleProfileChange} placeholder="Age" type="number" />
                  <input className="form-control mb-2" name="language" value={profileForm.language} onChange={handleProfileChange} placeholder="Languages" />
                  
                  {/* Links Section */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Links</label>
                    {profileForm.links.map((link, idx) => (
                      <div key={idx} className="d-flex gap-2 mb-2">
                        <input 
                          className="form-control" 
                          placeholder="Label (e.g., Portfolio)" 
                          value={link.label} 
                          onChange={e => handleLinkChange(idx, 'label', e.target.value)} 
                        />
                        <input 
                          className="form-control" 
                          placeholder="URL" 
                          value={link.url} 
                          onChange={e => handleLinkChange(idx, 'url', e.target.value)} 
                        />
                        <button 
                          className="btn btn-outline-danger btn-sm" 
                          onClick={() => handleRemoveLink(idx)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                    <button 
                      className="btn btn-outline-light btn-sm" 
                      onClick={handleAddLink}
                    >
                      <FaPlus className="me-1" />Add Link
                    </button>
                  </div>
                  
                  <button className="btn btn-light w-100 mt-2" onClick={handleProfileSave} disabled={saving}>
                    {saving ? 'Saving...' : <><FaSave className="me-1" />Save</>}
                  </button>
                </>
              ) : (
                <>
                  <h4 className="fw-bold mb-1">{user.name || 'Your Name'}</h4>
                  <div className="mb-2">{user.bio || 'No bio yet. Click edit to add one!'}</div>
                  <div className="mb-2">
                    {user.city && <span className="badge bg-light text-primary me-2">{user.city}</span>}
                    {user.age && <span className="badge bg-light text-primary me-2">{user.age} yrs</span>}
                    {user.language && <span className="badge bg-light text-primary">{user.language}</span>}
                  </div>
                  {user.links && user.links.length > 0 && (
                    <div className="mb-2">
                      {user.links.map((link, idx) => (
                        <a 
                          key={idx} 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="badge bg-light text-primary me-2 d-inline-block mb-1"
                          style={{textDecoration: 'none'}}
                        >
                          <FaLink className="me-1" />
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                                     <div className="mt-3 mb-2">
                     <span className="me-2"><FaStar className="text-warning" /> <b>{user.reputation || 0}</b></span>
                     <span className="text-light">({user.reviews || 0} reviews)</span>
                   </div>
                  <button className="btn btn-outline-light w-100" onClick={()=>setEditProfile(true)}><FaEdit className="me-1" />Edit Profile</button>
                </>
              )}
            </div>
          </div>

          {/* Main Content - Tabs */}
          <div className="col-lg-8">
            <div className="rounded-4 shadow-lg p-4" style={{background:'#fff', minHeight:'420px'}}>
              <div className="d-flex mb-4 gap-2 flex-wrap">
                {tabList.map(tab => (
                  <button key={tab.key} className={`btn ${activeTab===tab.key ? 'btn-primary' : 'btn-outline-primary'} d-flex align-items-center gap-2`} onClick={()=>setActiveTab(tab.key)}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab==='skills' && (
                <div>
                  <h5 className="mb-3">Skills you can teach/share</h5>
                  {user.skills.length === 0 ? (
                    <div className="text-center text-secondary py-4">
                      <FaTools size={48} className="mb-3" />
                      <p>No skills added yet. Add your first skill to get started!</p>
                    </div>
                  ) : (
                    user.skills.map((skill, idx) => (
                      <div key={idx} className="d-flex align-items-center mb-2">
                        <input className="form-control me-2" value={skill} onChange={e=>handleSkillChange(idx, e.target.value)} placeholder="Enter skill name" />
                        <button className="btn btn-outline-danger btn-sm" onClick={()=>handleRemoveSkill(idx)}><FaTrash /></button>
                      </div>
                    ))
                  )}
                  <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-outline-success" onClick={handleAddSkill}><FaPlus className="me-1" />Add Skill</button>
                    {user.skills.length > 0 && (
                      <button className="btn btn-primary" onClick={handleSaveSkills} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Skills'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab==='wants' && (
                <div>
                  <h5 className="mb-3">Skills you want to learn</h5>
                  {user.wants.length === 0 ? (
                    <div className="text-center text-secondary py-4">
                      <FaLightbulb size={48} className="mb-3" />
                      <p>No skills to learn added yet. Add skills you want to learn!</p>
                    </div>
                  ) : (
                    user.wants.map((want, idx) => (
                      <div key={idx} className="d-flex align-items-center mb-2">
                        <input className="form-control me-2" value={want} onChange={e=>handleWantChange(idx, e.target.value)} placeholder="Enter skill name" />
                        <button className="btn btn-outline-danger btn-sm" onClick={()=>handleRemoveWant(idx)}><FaTrash /></button>
                      </div>
                    ))
                  )}
                  <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-outline-info" onClick={handleAddWant}><FaPlus className="me-1" />Add Skill to Learn</button>
                    {user.wants.length > 0 && (
                      <button className="btn btn-primary" onClick={handleSaveSkills} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Skills'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab==='wallet' && (
                <div className="text-center">
                  <h5 className="mb-3">Your Time Credits Wallet</h5>
                  <div className="display-4 fw-bold mb-2" style={{color:'#185a9d'}}>{user.timeBalance} <span style={{fontSize:'1.1rem',color:'#43cea2'}}>credits</span></div>
                  <div className="text-secondary">Earn credits by teaching, spend them to learn!</div>
                  <div className="mt-4">
                    <p className="text-muted">Start adding skills and connecting with others to earn your first credits!</p>
                  </div>
                </div>
              )}

              {activeTab==='links' && (
                <div>
                  <h5 className="mb-3">Your Links</h5>
                  {user.links.length === 0 ? (
                    <div className="text-center text-secondary py-4">
                      <FaLink size={48} className="mb-3" />
                      <p>No links added yet. Add your portfolio, social media, or other important links!</p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {user.links.map((link, idx) => (
                        <div key={idx} className="col-md-6">
                          <div className="card border-0 shadow-sm">
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <h6 className="card-title mb-1">{link.label}</h6>
                                  <a 
                                    href={link.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-decoration-none text-primary"
                                  >
                                    {link.url}
                                  </a>
                                </div>
                                <a 
                                  href={link.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-outline-primary btn-sm"
                                >
                                  <FaLink />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3">
                    <p className="text-muted">
                      <small>💡 Tip: Add your portfolio, LinkedIn, GitHub, or other professional links to help others discover your work!</small>
                    </p>
                   </div>
                 </div>
               )}

              {activeTab==='webinars' && (
                <div>
                   <h5 className="mb-3">Your Webinars</h5>
                      <div className="text-center text-secondary py-4">
                        <FaCamera size={48} className="mb-3" />
                     <p>Manage your webinars and track your sessions!</p>
                     <a href="/webinars" className="btn btn-primary">
                       <FaCamera className="me-2" />
                       View My Webinars
                     </a>
                      </div>
                </div>
              )}

                             {activeTab==='reputation' && (
                 <div>
                   <div className="d-flex justify-content-between align-items-center mb-3">
                     <h5>Your Reputation & Reviews</h5>
                   </div>

                   {/* Overall Rating */}
                    <div className="text-center mb-4">
                      <div className="display-5 fw-bold mb-2" style={{color:'#185a9d'}}>
                        <FaStar className="text-warning mb-1" /> 
                        {user.reputation > 0 ? user.reputation.toFixed(1) : '0.0'}
                      </div>
                      <div className="text-secondary mb-3">
                        Based on {user.reviews || 0} {(user.reviews || 0) === 1 ? 'review' : 'reviews'} from other users.
                      </div>
                    </div>

                   {/* Review Form Modal */}
                   {showReviewForm && (
                     <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                       <div className="modal-dialog modal-lg">
                         <div className="modal-content">
                           <div className="modal-header">
                             <h5 className="modal-title">Give a Review</h5>
                             <button 
                               type="button" 
                               className="btn-close" 
                               onClick={() => setShowReviewForm(false)}
                             ></button>
                           </div>
                           <div className="modal-body">
                             <ReviewForm
                               reviewedUser={user}
                               onReviewSubmitted={() => {
                                 setShowReviewForm(false);
                                 loadUserReviews();
                                 refreshUserData(); // Refresh user data to update reputation stats
                               }}
                               onCancel={() => setShowReviewForm(false)}
                               context="general"
                             />
                           </div>
                         </div>
                       </div>
                     </div>
                   )}

                   {/* Reviews List */}
                   <div className="mb-4">
                     <h6 className="mb-3">Recent Reviews</h6>
                     {reviewsLoading ? (
                       <div className="text-center py-4">
                         <div className="spinner-border text-primary" role="status">
                           <span className="visually-hidden">Loading...</span>
                         </div>
                       </div>
                     ) : userReviews.length === 0 ? (
                       <div className="text-center text-secondary py-4">
                         <FaStar size={48} className="mb-3" />
                         <p>No reviews yet. Start interacting with others to receive reviews!</p>
                       </div>
                     ) : (
                       <div className="list-group">
                         {userReviews.map(review => (
                           <div key={review._id} className="list-group-item border-0 shadow-sm mb-2">
                             <div className="d-flex justify-content-between align-items-start">
                               <div className="flex-grow-1">
                                 <div className="d-flex align-items-center mb-2">
                                   <img 
                                     src={review.reviewer.profilePicture || '/default-avatar.png'} 
                                     alt="Reviewer" 
                                     className="rounded-circle me-2" 
                                     style={{width: '32px', height: '32px'}}
                                   />
                                   <div>
                                     <strong>{review.reviewer.firstName} {review.reviewer.lastName}</strong>
                                     <div className="d-flex align-items-center">
                                       {[1, 2, 3, 4, 5].map(star => (
                                         <FaStar 
                                           key={star} 
                                           className={`${star <= review.rating ? 'text-warning' : 'text-muted'}`}
                                           size={12}
                                         />
                                       ))}
                                       <span className="ms-2 text-muted">{review.rating}.0</span>
                                     </div>
                                   </div>
                                 </div>
                                 <p className="mb-2">{review.comment}</p>
                                 <div className="d-flex justify-content-between align-items-center">
                                   <small className="text-muted">
                                     {review.category} • {new Date(review.createdAt).toLocaleDateString()}
                                   </small>
                                   <small className="text-muted">
                                     {review.helpfulCount} found helpful
                                   </small>
                                 </div>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>

                   {/* Rating Breakdown */}
                   {user.reviews > 0 && userReviews.length > 0 && (
                     <div className="row justify-content-center mb-4">
                       <div className="col-md-8">
                         <div className="card border-0 shadow-sm">
                           <div className="card-body">
                             <h6 className="card-title">Rating Breakdown</h6>
                             {(() => {
                               const { breakdown, percentages } = calculateRatingBreakdown();
                               return [5, 4, 3, 2, 1].map(rating => (
                                 breakdown[rating] > 0 && (
                                   <div key={rating} className="d-flex justify-content-between align-items-center mb-2">
                                     <span>{rating} {rating === 1 ? 'star' : 'stars'}</span>
                                     <div className="progress flex-grow-1 mx-2" style={{height: '8px'}}>
                                       <div className="progress-bar bg-warning" style={{width: `${percentages[rating]}%`}}></div>
                                     </div>
                                     <span>{percentages[rating]}%</span>
                                   </div>
                                 )
                               ));
                             })()}
                           </div>
                         </div>
                       </div>
                     </div>
                   )}
                   
                   <div className="mt-4 text-center">
                     <p className="text-muted">Start swapping skills to build your reputation!</p>
                   </div>
                 </div>
               )}

              {activeTab==='badges' && (
                <div className="text-center">
                  <h5 className="mb-3">Your Achievements</h5>
                  
                  {/* Level and Experience */}
                  <div className="row justify-content-center mb-4">
                    <div className="col-md-6">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body">
                          <h6 className="card-title">Level {user.achievements.level}</h6>
                          <div className="progress mb-2" style={{height: '10px'}}>
                            <div 
                              className="progress-bar bg-primary" 
                              style={{
                                width: `${Math.min(100, (user.achievements.experience % 100))}%`
                              }}
                            ></div>
                          </div>
                          <small className="text-muted">
                            {user.achievements.experience} XP • {user.achievements.totalBadges} badges earned
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>

                                     {user.achievements.badges.length === 0 ? (
                     <div className="text-secondary py-4">
                       <FaMedal size={48} className="mb-3" />
                       <p>No badges yet. Complete swaps and activities to earn badges automatically!</p>
                       <small className="text-muted">Badges are awarded automatically based on your activities like earning credits, adding skills, receiving reviews, and completing swaps.</small>
                     </div>
                   ) : (
                     <div className="d-flex flex-wrap justify-content-center gap-3 mb-4">
                       {user.achievements.badges.map((badge, idx) => (
                         <div key={idx} className="card border-0 shadow-sm" style={{minWidth: '200px'}}>
                           <div className="card-body text-center">
                             <div className="fs-1 mb-2">{badge.icon}</div>
                             <h6 className="card-title">{badge.name}</h6>
                             <p className="card-text text-muted small">{badge.description}</p>
                             <small className="text-secondary">
                               Earned {new Date(badge.earnedAt).toLocaleDateString()}
                             </small>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
              )}

              {activeTab==='referral' && (
                <div className="text-center">
                  <h5 className="mb-3">Invite Friends & Earn Credits</h5>
                  
                  {referralLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Referral Link */}
                      <div className="mb-4">
                        <h6 className="mb-2">Your Referral Link</h6>
                        <div className="input-group mb-2" style={{maxWidth:'400px',margin:'0 auto'}}>
                          <input 
                            className="form-control" 
                            value={`${window.location.origin}/register?ref=${referralStats.referralCode}`} 
                            readOnly 
                          />
                          <button 
                            className="btn btn-outline-primary" 
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/register?ref=${referralStats.referralCode}`);
                              setSuccess('Referral link copied!');
                              setTimeout(() => setSuccess(''), 3000);
                            }}
                          >
                            <FaCopy />
                          </button>
                        </div>
                        <small className="text-muted">Share this link with friends to earn 10 credits when they join!</small>
                      </div>

                      {/* Referral Statistics */}
                      <div className="row justify-content-center mb-4">
                        <div className="col-md-8">
                          <div className="card border-0 shadow-sm">
                            <div className="card-body">
                              <h6 className="card-title mb-3">Your Referral Stats</h6>
                              <div className="row text-center">
                                <div className="col-4">
                                  <div className="h4 text-primary mb-1">{referralStats.referralStats.totalReferrals}</div>
                                  <small className="text-muted">Total Referrals</small>
                                </div>
                                <div className="col-4">
                                  <div className="h4 text-success mb-1">{referralStats.referralStats.successfulReferrals}</div>
                                  <small className="text-muted">Successful</small>
                                </div>
                                <div className="col-4">
                                  <div className="h4 text-warning mb-1">{referralStats.referralStats.creditsEarned}</div>
                                  <small className="text-muted">Credits Earned</small>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* How it works */}
                      <div className="text-start" style={{maxWidth:'500px',margin:'0 auto'}}>
                        <h6 className="mb-3">How it works:</h6>
                        <ul className="list-unstyled">
                          <li className="mb-2">✅ Share your referral link with friends</li>
                          <li className="mb-2">✅ When they sign up using your link, you get 10 credits</li>
                          <li className="mb-2">✅ Credits are automatically added to your wallet</li>
                          <li className="mb-2">✅ Use credits to schedule skill swap sessions</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab==='calendar' && (
                <div>
                  <h5 className="mb-3">Swap Calendar</h5>
                  {calendarLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <Calendar 
                      swaps={calendarSwaps}
                      onAddEvent={handleAddCalendarEvent}
                      onEditEvent={(eventId) => console.log('Edit event:', eventId)}
                      onDeleteEvent={(eventId) => console.log('Delete event:', eventId)}
                    />
                  )}
                </div>
              )}

              {/* {activeTab==='settings' && (
                <div style={{maxWidth:'400px',margin:'0 auto'}}>
                  <h5 className="mb-3">Settings</h5>
                  <div className="mb-3">
                    <label className="form-label">Change Password</label>
                    <input type="password" className="form-control" placeholder="New password" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Preferred Language</label>
                    <input type="text" className="form-control" placeholder="Language" />
                  </div>
                  <div className="form-check mb-3">
                    <input className="form-check-input" type="checkbox" id="notifCheck" />
                    <label className="form-check-label" htmlFor="notifCheck">Enable Notifications</label>
                  </div>
                  <button className="btn btn-primary w-100">Save Settings</button>
                </div>
              )} */}

              {activeTab==='notifications' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>Notifications</h5>
                    {Array.isArray(notifications) && notifications.length > 0 && (
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={async () => {
                          if (token) {
                            try {
                              await NotificationService.markAllAsRead(token);
                              setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                              fetchUnreadCount();
                            } catch (error) {
                              console.error('Failed to mark all as read:', error);
                            }
                          }
                        }}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  
                  {notificationsLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (!Array.isArray(notifications) || notifications.length === 0) ? (
                    <div className="text-center text-secondary py-4">
                      <FaBell size={48} className="mb-3" />
                      <p>No notifications yet. Start using the platform to receive notifications!</p>
                    </div>
                  ) : (
                    <div className="list-group">
                      {(Array.isArray(notifications) ? notifications : []).map(notification => (
                        <div 
                          key={notification._id} 
                          className={`list-group-item ${!notification.isRead ? 'bg-light' : ''}`}
                          style={{border: 'none', borderBottom: '1px solid #dee2e6'}}
                        >
                          <div className="d-flex align-items-start">
                                                         <div className="me-3 mt-1">
                               {notification.type === 'swap_request' && <FaExchangeAlt className="text-info" />}
                               {notification.type === 'swap_accepted' && <FaCheckCircle className="text-success" />}
                               {notification.type === 'swap_rejected' && <FaTimes className="text-danger" />}
                               {notification.type === 'swap_completed' && <FaCheckCircle className="text-success" />}
                               {notification.type === 'swap_cancelled' && <FaTimes className="text-warning" />}
                               {notification.type === 'swap_rated' && <FaStar className="text-warning" />}
                               {notification.type === 'swap_scheduled' && <FaClock className="text-primary" />}
                               {notification.type === 'message' && <FaComments className="text-primary" />}
                             </div>
                            <div className="flex-grow-1">
                              <div className="fw-bold">{notification.title}</div>
                              <div className="text-muted">{notification.message}</div>
                              <small className="text-secondary">
                                {new Date(notification.createdAt).toLocaleString()}
                              </small>
                            </div>
                            <div className="ms-2">
                              {!notification.isRead && (
                                <button 
                                  className="btn btn-sm btn-outline-primary me-1"
                                  onClick={() => handleMarkAsRead(notification._id)}
                                >
                                  Mark read
                                </button>
                              )}
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteNotification(notification._id)}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 