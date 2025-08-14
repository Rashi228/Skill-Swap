import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Create socket connection
      const newSocket = io('http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        
        // Authenticate user with socket
        if (user && user._id) {
          newSocket.emit('authenticate', user._id);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
      };
    } else {
      // Disconnect if user is not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for new swap requests
    socket.on('new_swap_request', (data) => {
      console.log('New swap request received:', data);
      // You can add toast notifications here
      // toast.info(data.message);
    });

    // Listen for swap responses
    socket.on('swap_response_received', (data) => {
      console.log('Swap response received:', data);
      // You can add toast notifications here
      // toast.success(data.message);
    });

    // Listen for new messages
    socket.on('message_received', (data) => {
      console.log('New message received:', data);
      // Handle new message notification
    });

    // Listen for typing indicators
    socket.on('user_typing', (data) => {
      console.log('User typing:', data);
      // Handle typing indicator
    });

    socket.on('user_stopped_typing', (data) => {
      console.log('User stopped typing:', data);
      // Handle typing indicator stop
    });

    // Listen for profile updates
    socket.on('user_profile_updated', (data) => {
      console.log('User profile updated:', data);
      // Update user profile in context if it's the current user
      if (data.userId === user?._id) {
        // Update user context with new profile data
        // This will be handled by the AuthContext
      }
    });

    // Listen for wallet updates
    socket.on('wallet_balance_updated', (data) => {
      console.log('Wallet balance updated:', data);
      // Update wallet balance in context
      // This will be handled by the Wallet component
    });

    // Listen for user status changes
    socket.on('user_status_changed', (data) => {
      console.log('User status changed:', data);
      // Update user online/offline status
      // This will be handled by the UserDiscovery component
    });

    // Listen for calendar updates
    socket.on('calendar_data_updated', (data) => {
      console.log('Calendar data updated:', data);
      // Update calendar data
      // This will be handled by the Calendar component
    });

    // Listen for new achievements
    socket.on('new_achievement', (data) => {
      console.log('New achievement earned:', data);
      // Show achievement notification
      // This will be handled by the Dashboard component
    });

    // Listen for webinar status updates
    socket.on('webinar_status_updated', (data) => {
      console.log('Webinar status updated:', data);
      // Update webinar status
      // This will be handled by the Webinars component
    });

    return () => {
      socket.off('new_swap_request');
      socket.off('swap_response_received');
      socket.off('message_received');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
      socket.off('user_profile_updated');
      socket.off('wallet_balance_updated');
      socket.off('user_status_changed');
      socket.off('calendar_data_updated');
      socket.off('new_achievement');
      socket.off('webinar_status_updated');
    };
  }, [socket, user]);

  const value = {
    socket,
    isConnected,
    // Helper functions
    emitSwapRequest: (data) => {
      if (socket && isConnected) {
        socket.emit('swap_request', data);
      }
    },
    emitSwapResponse: (data) => {
      if (socket && isConnected) {
        socket.emit('swap_response', data);
      }
    },
    emitNewMessage: (data) => {
      if (socket && isConnected) {
        socket.emit('new_message', data);
      }
    },
    emitTypingStart: (data) => {
      if (socket && isConnected) {
        socket.emit('typing_start', data);
      }
    },
    emitTypingStop: (data) => {
      if (socket && isConnected) {
        socket.emit('typing_stop', data);
      }
    },
    emitProfileUpdate: (data) => {
      if (socket && isConnected) {
        socket.emit('profile_updated', data);
      }
    },
    emitWalletUpdate: (data) => {
      if (socket && isConnected) {
        socket.emit('wallet_updated', data);
      }
    },
    emitUserOnline: (data) => {
      if (socket && isConnected) {
        socket.emit('user_online', data);
      }
    },
    emitCalendarUpdate: (data) => {
      if (socket && isConnected) {
        socket.emit('calendar_updated', data);
      }
    },
    emitAchievementEarned: (data) => {
      if (socket && isConnected) {
        socket.emit('achievement_earned', data);
      }
    },
    emitWebinarStatusChange: (data) => {
      if (socket && isConnected) {
        socket.emit('webinar_status_changed', data);
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 