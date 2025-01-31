# UniSphere Backend API

## Overview
This backend API serves as the server-side component for a decentralized government procurement platform. Built with Node.js, Express, and Blockchain integration, it provides secure endpoints for RFP management, vendor bidding, and contract administration with transparent transaction tracking.

## Table of Contents
- [Technologies Used](#technologies-used)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Smart Contracts](#smart-contracts)
- [Testing](#testing)
- [Contributing](#contributing)

## Technologies Used
- Node.js & Express.js
- TypeScript
- PostgreSQL with TypeORM
- Ethereum (Sepolia Testnet)
- Hardhat & Ethers.js
- OpenAI GPT-4 for RFP Analysis
- JWT Authentication
- Socket.IO for Real-time Updates

## Features
- **Decentralized RFP Management**
  - Create and publish RFPs with blockchain verification
  - Track RFP lifecycle with transaction hashes
  - AI-powered RFP description generation

- **Smart Contract Integration**
  - Transparent transaction logging
  - Immutable bid submissions
  - Verifiable contract awards

- **Advanced Bid Management**
  - AI-powered bid analysis
  - Automated evaluation scoring
  - Blockchain-verified submissions

- **Role-Based Access Control**
  - GPO (Government Procurement Officer) management
  - Vendor verification system
  - Public transparency features

## Prerequisites
- Node.js (v14 or higher)
- PostgreSQL
- MetaMask or similar Web3 provider
- Sepolia testnet access
- npm or yarn
- OpenAI API key

## Project Structure
```
unisphere/
├── src/
│   ├── controllers/     # Request handlers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   └── server.ts       # Main application file
├── contracts/          # Smart contracts
├── scripts/           # Deployment scripts
├── test/             # Test files
├── documentation.md   # Detailed system documentation
├── prompts.md        # AI prompts documentation
└── docker/           # Docker configuration
```

## Installation

### Standard Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd unisphere
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the variables with your configuration
```bash
cp .env.example .env
```

4. Deploy smart contracts:
```bash
# Configure your network in hardhat.config.ts first
npx hardhat run scripts/deploy.ts --network sepolia
```

5. Run database migrations:
```bash
npx typeorm-ts-node-commonjs migration:run -d src/config/database.ts
```

6. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Docker Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd unisphere
```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the variables with your configuration
```bash
cp .env.example .env
```

3. Build and start the containers:
```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f
```

The Docker setup includes:
- Node.js application container
- PostgreSQL database
- Redis for caching
- Nginx reverse proxy

4. Run migrations inside the container:
```bash
docker-compose exec app npx typeorm-ts-node-commonjs migration:run -d src/config/database.ts
```

5. Deploy smart contracts (if needed):
```bash
docker-compose exec app npx hardhat run scripts/deploy.ts --network sepolia
```

### Accessing the Application
- API: `http://localhost:3000/api`
- Swagger Documentation: `http://localhost:3000/api-docs`
- PostgreSQL: `localhost:5432`

### Available Scripts
```bash
# Development
npm run dev           # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run linter
npm run format       # Format code

# Docker
docker-compose up    # Start all services
docker-compose down  # Stop all services
docker-compose logs  # View logs
docker-compose ps    # List containers
```

### Troubleshooting

#### Standard Installation
1. Database Connection Issues:
```bash
# Check PostgreSQL status
sudo service postgresql status

# Reset database
npm run db:reset
```

2. Smart Contract Deployment:
```bash
# Verify network configuration
cat hardhat.config.ts

# Check balance
npx hardhat balance --network sepolia
```

#### Docker Installation
1. Container Issues:
```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild from scratch
docker-compose up -d --build --force-recreate
```

2. Database Connection:
```bash
# Check database logs
docker-compose logs db

# Access database directly
docker-compose exec db psql -U postgres
```

3. Permission Issues:
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Fix docker socket permission
sudo chmod 666 /var/run/docker.sock
```

## Environment Variables
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=unisphere
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h

# Blockchain
SEPOLIA_URL=your_sepolia_rpc_url
ADMIN_PRIVATE_KEY=your_admin_wallet_private_key
PROCUREMENT_LOG_ADDRESS=your_contract_address

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

## API Documentation
- Detailed API documentation: [documentation.md](./documentation.md)
- Postman Collection: [UniSphere API Documentation](https://documenter.getpostman.com/view/11604430/2sAYQgg8Jy)
- AI Prompts Documentation: [prompts.md](./prompts.md)

## Smart Contracts

### ProcurementLog Contract
The main smart contract that handles:
- RFP creation and publication logging
- Bid submission verification
- Contract award recording
- Milestone tracking

### Transaction Tracking
All major operations are logged on the blockchain:
- RFP Creation: `creationTxUrl`
- RFP Publication: `publicationTxUrl`
- Bid Submissions
- Contract Awards
- Milestone Updates

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support
For support, email support@unisphere.com or create an issue in the repository.

