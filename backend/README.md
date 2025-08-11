# SkillSwap Backend API

This is the backend API for the SkillSwap platform, built with Node.js, Express, and MongoDB.

## Features

- 🔐 User authentication with JWT
- 👥 User management and profiles
- 🎯 Skills management
- 🔄 Swap request system
- 💬 Real-time chat with file sharing
- 💰 Wallet and transaction system
- 🔔 Notification system
- 👨‍💼 Admin panel
- 📊 Analytics and reporting

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

## Installation

1. **Clone the repository and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   Then edit `.env` with your configuration.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Environment Variables

Copy `env.example` to `.env` and configure:

- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `FRONTEND_URL`: Frontend URL for CORS
- `EMAIL_*`: Email configuration for notifications
- `CLOUDINARY_*`: Cloudinary configuration for file uploads

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Skills
- `GET /api/skills` - Get all skills
- `POST /api/skills` - Create skill
- `PUT /api/skills/:id` - Update skill
- `DELETE /api/skills/:id` - Delete skill

### Swaps
- `GET /api/swaps` - Get all swaps
- `POST /api/swaps` - Create swap request
- `PUT /api/swaps/:id` - Update swap
- `DELETE /api/swaps/:id` - Delete swap

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

### Chat
- `GET /api/chat/conversations` - Get conversations
- `GET /api/chat/conversations/:id/messages` - Get messages
- `POST /api/chat/conversations/:id/messages` - Send message

### Admin
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - Get all users (admin)
- `PUT /api/admin/users/:id` - Update user (admin)

### Wallet
- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/transactions` - Create transaction

## Database Models

### User
- Authentication fields (username, email, password)
- Profile information (firstName, lastName, bio, location)
- Skills arrays (skills, skillsToLearn)
- Wallet information
- Preferences and settings

### Swap
- Request details
- Participants
- Status tracking
- Reviews and ratings

### Notification
- User notifications
- Read/unread status
- Different types (swap requests, messages, etc.)

## Development

### Running in Development
```bash
npm run dev
```

### Running in Production
```bash
npm start
```

### Testing
```bash
npm test
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── auth.js
│   ├── utils/
│   └── server.js
├── package.json
├── env.example
└── README.md
```

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS configuration
- Helmet security headers
- Input validation with express-validator

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License 