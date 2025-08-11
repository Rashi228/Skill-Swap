# SkillSwap Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication Endpoints

### Register User
```
POST /auth/register
```
**Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Login User
```
POST /auth/login
```
**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User
```
GET /auth/me
```

### Logout User
```
POST /auth/logout
```

---

## 👥 User Management

### Get All Users
```
GET /users?page=1&limit=10&search=john&skill=javascript&location=NYC
```

### Get User by ID
```
GET /users/:id
```

### Update User Profile
```
PUT /users/:id
```
**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Software developer",
  "location": "New York",
  "profilePicture": "https://example.com/avatar.jpg"
}
```

### Update User Skills
```
PUT /users/:id/skills
```
**Body:**
```json
{
  "skills": [
    {
      "name": "JavaScript",
      "level": "advanced",
      "description": "5 years of experience"
    }
  ],
  "skillsToLearn": [
    {
      "name": "Python",
      "priority": "high",
      "description": "Want to learn for data science"
    }
  ]
}
```

---

## 🎯 Skills Discovery

### Get All Skills
```
GET /skills?search=javascript&level=advanced&category=Programming
```

### Get Popular Skills
```
GET /skills/popular?limit=10
```

### Get Users with Specific Skill
```
GET /skills/users/javascript?level=advanced&page=1&limit=10
```

### Get Skill Categories
```
GET /skills/categories
```

### Get Skill Levels
```
GET /skills/levels
```

---

## 🔄 Swaps & Workshops

### Get All Swaps
```
GET /swaps?type=group&status=pending&category=Programming&search=javascript&skill=react&page=1&limit=10
```

### Get User's Swaps
```
GET /swaps/my-swaps?type=created
```

### Get Swap by ID
```
GET /swaps/:id
```

### Create New Swap
```
POST /swaps
```
**Body:**
```json
{
  "title": "Learn React Basics",
  "description": "I'll teach you React fundamentals in exchange for Python help",
  "type": "one-to-one",
  "scheduledDate": "2024-01-15T14:00:00Z",
  "duration": 60,
  "location": "Online",
  "maxParticipants": 1,
  "isPublic": false,
  "category": "Programming",
  "tags": ["react", "javascript", "frontend"],
  "price": 0,
  "currency": "USD",
  "rewards": 50,
  "skillsOffered": [
    {
      "name": "React",
      "level": "advanced",
      "description": "5 years of React experience"
    }
  ],
  "skillsRequested": [
    {
      "name": "Python",
      "level": "beginner",
      "description": "Want to learn Python basics"
    }
  ]
}
```

### Update Swap
```
PUT /swaps/:id
```
**Body:** (same as create, but all fields optional)

### Join Swap
```
POST /swaps/:id/join
```
**Body:**
```json
{
  "role": "learner"
}
```

### Update Participant Status
```
PUT /swaps/:id/participant-status
```
**Body:**
```json
{
  "participantId": "user_id_here",
  "status": "accepted"
}
```

### Add Review to Swap
```
POST /swaps/:id/review
```
**Body:**
```json
{
  "rating": 5,
  "comment": "Great learning experience!"
}
```

### Delete Swap
```
DELETE /swaps/:id
```

---

## 📊 Swap Types

### 1-to-1 Swaps
- Direct skill exchange between two users
- `maxParticipants: 1`
- `type: "one-to-one"`

### Group Swaps
- Multiple participants learning together
- `maxParticipants: 2-10`
- `type: "group"`

### Workshops
- Larger learning sessions
- `maxParticipants: 5-50`
- `type: "workshop"`
- `isPublic: true`

---

## 🔄 Swap Status Flow

1. **pending** - Swap created, waiting for participants
2. **accepted** - Participants accepted, swap confirmed
3. **in-progress** - Swap is currently happening
4. **completed** - Swap finished successfully
5. **cancelled** - Swap cancelled by creator
6. **expired** - Swap expired without participants

---

## 🎯 Participant Roles

- **learner** - Learning the offered skill
- **teacher** - Teaching the offered skill
- **both** - Both learning and teaching

---

## 📝 Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

### Pagination Response
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

---

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/skillswap
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

---

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```

3. **Test the API:**
   ```bash
   curl http://localhost:5000/api/health
   ```

---

## 🔔 Notifications

### Get All Notifications
```
GET /notifications?page=1&limit=20&type=swap_request&isRead=false&priority=high
```

### Get Unread Count
```
GET /notifications/unread-count
```

### Get Specific Notification
```
GET /notifications/:id
```

### Mark Notification as Read
```
PUT /notifications/:id/read
```

### Mark Notification as Unread
```
PUT /notifications/:id/unread
```

### Mark All Notifications as Read
```
PUT /notifications/read-all
```

### Mark Multiple Notifications as Read
```
PUT /notifications/read-multiple
```
**Body:**
```json
{
  "notificationIds": ["id1", "id2", "id3"]
}
```

### Delete Notification
```
DELETE /notifications/:id
```

### Delete Multiple Notifications
```
DELETE /notifications/delete-multiple
```
**Body:**
```json
{
  "notificationIds": ["id1", "id2", "id3"]
}
```

### Delete All Read Notifications
```
DELETE /notifications/delete-read
```

### Get Notification Types
```
GET /notifications/types
```

### Get Notification Priorities
```
GET /notifications/priorities
```

---

## 💬 Chat System

### Get Conversations
```
GET /chat/conversations?page=1&limit=20&type=direct
```

### Get Specific Conversation
```
GET /chat/conversations/:id
```

### Create Conversation
```
POST /chat/conversations
```
**Body:**
```json
{
  "type": "direct",
  "participants": ["user_id"],
  "title": "Group Chat",
  "description": "Optional description"
}
```

### Get Messages
```
GET /chat/conversations/:id/messages?page=1&limit=50&before=timestamp
```

### Send Message
```
POST /chat/conversations/:id/messages
```
**Body:**
```json
{
  "content": "Hello!",
  "replyTo": "message_id"
}
```

### Edit Message
```
PUT /chat/messages/:id
```
**Body:**
```json
{
  "content": "Updated message"
}
```

### Delete Message
```
DELETE /chat/messages/:id
```

### Add Reaction
```
POST /chat/messages/:id/reactions
```
**Body:**
```json
{
  "emoji": "👍"
}
```

### Add Participant
```
POST /chat/conversations/:id/participants
```
**Body:**
```json
{
  "userId": "user_id",
  "role": "participant"
}
```

### Remove Participant
```
DELETE /chat/conversations/:id/participants/:userId
```

### Pin Message
```
POST /chat/conversations/:id/pin/:messageId
```

### Unpin Message
```
DELETE /chat/conversations/:id/pin/:messageId
```

### Send Meeting Link
```
POST /chat/conversations/:id/meeting
```
**Body:**
```json
{
  "meetingUrl": "https://meet.google.com/abc-defg-hij",
  "meetingTitle": "React Tutorial Session"
}
```

### Search Chat
```
GET /chat/search?q=hello&type=all
```

---

## 📋 Next Features to Implement

- [x] Notifications system
- [x] Chat functionality
- [ ] Wallet/transactions
- [ ] Admin panel
- [ ] File uploads
- [ ] Real-time updates (Socket.io)
- [ ] Email notifications
- [ ] Payment integration 