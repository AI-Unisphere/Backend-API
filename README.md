# Backend API Documentation

## Overview
This backend API serves as the server-side component for managing user authentication, chat history, and AI interactions. Built with Node.js and Express, it provides secure endpoints for user management and conversation handling.

## Table of Contents
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Contributing](#contributing)

## Technologies Used
- Node.js
- Express.js
- MongoDB
- JWT (JSON Web Tokens)
- bcrypt
- OpenAI API
- Socket.IO

## Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn
- OpenAI API key

## Installation
1. Clone the repository:
```bash
git clone <repository-url>
cd backend-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see [Environment Variables](#environment-variables) section)

4. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=development
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token

### Chat
- `POST /api/chat/conversation` - Create a new conversation
- `GET /api/chat/conversations` - Get user's conversations
- `GET /api/chat/conversation/:id` - Get specific conversation
- `DELETE /api/chat/conversation/:id` - Delete conversation
- `POST /api/chat/message` - Send a message
- `GET /api/chat/messages/:conversationId` - Get conversation messages

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `DELETE /api/user/profile` - Delete user account

## Database Schema

### User Schema
```javascript
{
  email: String,
  password: String (hashed),
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Conversation Schema
```javascript
{
  userId: ObjectId,
  title: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Message Schema
```javascript
{
  conversationId: ObjectId,
  content: String,
  role: String,
  createdAt: Date
}
```

## Authentication
The API uses JWT (JSON Web Tokens) for authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Error Handling
The API uses standard HTTP status codes and returns error responses in the following format:
```javascript
{
  error: {
    message: "Error message",
    code: "ERROR_CODE",
    status: 400
  }
}
```

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support
For support, email support@yourdomain.com or create an issue in the repository.

