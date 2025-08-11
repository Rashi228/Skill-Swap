const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/database');
const path = require('path');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Socket.io connection handling
const connectedUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User authentication and joining
  socket.on('authenticate', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`User ${userId} authenticated and joined room`);
  });

  // Handle swap request
  socket.on('swap_request', (data) => {
    const { toUserId, swapData } = data;
    const toSocketId = connectedUsers.get(toUserId);
    
    if (toSocketId) {
      io.to(toSocketId).emit('new_swap_request', {
        swapId: swapData._id,
        fromUser: swapData.fromUser,
        message: `You have a new swap request from ${swapData.fromUser.firstName} ${swapData.fromUser.lastName}`
      });
    }
  });

  // Handle swap response
  socket.on('swap_response', (data) => {
    const { toUserId, swapData, action } = data;
    const toSocketId = connectedUsers.get(toUserId);
    
    if (toSocketId) {
      io.to(toSocketId).emit('swap_response_received', {
        swapId: swapData._id,
        action: action, // 'accepted', 'rejected', 'cancelled'
        message: `Your swap request has been ${action}`
      });
    }
  });

  // Handle new message
  socket.on('new_message', (data) => {
    const { conversationId, message, participants } = data;
    
    participants.forEach(participantId => {
      const participantSocketId = connectedUsers.get(participantId);
      if (participantSocketId && participantSocketId !== socket.id) {
        io.to(participantSocketId).emit('message_received', {
          conversationId,
          message
        });
      }
    });
  });

  // Handle typing indicator
  socket.on('typing_start', (data) => {
    const { conversationId, participants } = data;
    participants.forEach(participantId => {
      const participantSocketId = connectedUsers.get(participantId);
      if (participantSocketId && participantSocketId !== socket.id) {
        io.to(participantSocketId).emit('user_typing', {
          conversationId,
          userId: socket.userId
        });
      }
    });
  });

  socket.on('typing_stop', (data) => {
    const { conversationId, participants } = data;
    participants.forEach(participantId => {
      const participantSocketId = connectedUsers.get(participantId);
      if (participantSocketId && participantSocketId !== socket.id) {
        io.to(participantSocketId).emit('user_stopped_typing', {
          conversationId,
          userId: socket.userId
        });
      }
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    }
  });
});

// CORS configuration (put this FIRST)
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Security middleware (disabled for development to fix CORS)
// app.use(helmet());
app.use(compression());

// Rate limiting
// Relax or skip in development and for auth endpoints to avoid 429s during testing
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const isDev = process.env.NODE_ENV !== 'production';
    const isAuthEndpoint = req.path.startsWith('/api/auth/login') || req.path.startsWith('/api/auth/register');
    return isDev || isAuthEndpoint;
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded assets (chat files/images)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/skills', require('./routes/skills'));

// Initialize swap routes with socket.io
const swapRoutes = require('./routes/swaps');
swapRoutes.setIO(io);
app.use('/api/swaps', swapRoutes.router);

// Initialize chat routes with socket.io
const chatRoutes = require('./routes/chat');
chatRoutes.setIO(io);
app.use('/api/chat', chatRoutes.router);

app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/webinars', require('./routes/webinars'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SkillSwap API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 SkillSwap Backend running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔌 Socket.io server ready for real-time connections`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, io }; 