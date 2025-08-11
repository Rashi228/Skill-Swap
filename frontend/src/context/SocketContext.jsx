import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

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

    return () => {
      socket.off('new_swap_request');
      socket.off('swap_response_received');
      socket.off('message_received');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
    };
  }, [socket]);

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
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 