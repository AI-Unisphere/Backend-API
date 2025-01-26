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
- [Project Structure](#project-structure)
- [Additional Documentation](#additional-documentation)
- [Docker Setup](#docker-setup)
- [Backend Architecture](#backend-architecture)
- [Testing](#testing)

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

## Project Structure
```
unisphere/
├── src/
│   ├── controllers/     # Request handlers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types and interfaces
│   └── server.ts       # Main application file
├── contracts/          # Smart contracts
├── scripts/           # Deployment and utility scripts
├── test/             # Test files
├── documentation.md   # Detailed system documentation
├── prompts.md        # AI prompts documentation
└── docker/           # Docker configuration files
```

## Additional Documentation
- [System Documentation](./documentation.md) - Detailed documentation about system architecture, user flows, and implementation details
- [AI Prompts Documentation](./prompts.md) - Documentation of AI prompts used in the system
- [API Documentation](https://documenter.getpostman.com/view/11604430/2sAYQgg8Jy) - Complete API documentation with examples

## Docker Setup
The application can be run using Docker for consistent development and deployment environments.

1. Build the Docker image:
```bash
docker build -t unisphere-api .
```

2. Run the container:
```bash
docker-compose up
```

The Docker setup includes:
- Node.js runtime environment
- MongoDB database
- Redis for caching
- Nginx as reverse proxy

### Docker Configuration Files
- `Dockerfile` - Main application container configuration
- `docker-compose.yml` - Multi-container Docker setup
- `docker/nginx/` - Nginx configuration for production
- `docker/mongodb/` - MongoDB initialization scripts

## Backend Architecture

### Core Components
1. **API Layer**
   - Express.js server
   - Route handlers
   - Middleware for authentication and validation

2. **Service Layer**
   - Business logic implementation
   - Smart contract interactions
   - AI integration services

3. **Data Layer**
   - MongoDB for main database
   - Blockchain integration via Hardhat
   - Redis for caching

### Key Features
- JWT-based authentication
- Role-based access control
- Smart contract integration
- AI-powered bid evaluation
- Real-time updates via WebSocket
- File upload handling
- Automated testing

### Security Measures
- Request rate limiting
- Input validation
- XSS protection
- CORS configuration
- Helmet security headers
- Environment variable encryption

## Testing

### API Testing
- Complete Postman collection available at [UniSphere API Documentation](https://documenter.getpostman.com/view/11604430/2sAYQgg8Jy)
- Collection includes:
  - Request examples
  - Environment variables
  - Test scripts
  - Response examples

### Running Tests
```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

### Test Structure
```
test/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data
```

