import React, { createContext, useContext, useState, useEffect } from 'react';
import NotificationService from '../services/notificationService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setToken(storedToken);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setUnreadNotifications(0);
    localStorage.removeItem('token');
  };

  // Refresh user data from server
  const refreshUser = async () => {
    if (token) {
      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    if (token) {
      try {
        const response = await NotificationService.getUnreadCount(token);
        setUnreadNotifications(response.unreadCount);
      } catch (error) {
        console.error('Failed to fetch unread notifications:', error);
      }
    }
  };

  // Update unread count
  const updateUnreadCount = (count) => {
    setUnreadNotifications(count);
  };

  // Fetch unread count when user logs in
  useEffect(() => {
    if (token && user) {
      fetchUnreadCount();
    }
  }, [token, user]);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user && !!token,
    unreadNotifications,
    fetchUnreadCount,
    updateUnreadCount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 