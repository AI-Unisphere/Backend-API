# UniSphere API Documentation

## Core Technologies

### 1. AI Integration
1. **Large Language Models (LLM)**
   - Model: IBM Granite-13B-Instruct
   - Use Cases:
     - RFP Information Extraction
     - Bid Analysis
     - Bid Evaluation
   - Features:
     - Open-source foundation model
     - JSON response formatting
     - Temperature control (0.3 default)
     - Maximum input tokens: 4,096
     - Maximum output tokens: 1,024
     - Top-p sampling: 0.9
     - Instruction-tuned for procurement tasks

2. **Retrieval-Augmented Generation (RAG)**
   - Components:
     - Embeddings Service (GraniteEmbeddingService)
       - Model: granite-embedding-30m-english
       - Dimensions: 768
       - Maximum sequence length: 512
       - Batch size: 32
     - Vector Store
       - In-memory storage
       - Cosine similarity search
       - Efficient document indexing
     - Document Processing
       - PDF text extraction
       - Intelligent chunking
       - Batch optimization
   - Features:
     - Semantic search with Granite embeddings
     - Context-aware analysis
     - Historical data integration
     - Memory-optimized document processing
     - Parallel batch processing

3. **Blockchain Integration**
   - Network: Sepolia Testnet
   - Smart Contracts:
     - ProcurementLog.sol
   - Transaction Logging:
     - RFP creation and publication
     - Bid submissions
     - Bid evaluations

### 2. Authentication & Security
1. **JWT Implementation**
   - Token-based authentication
   - Role-based access control
   - Token expiration management
   - Refresh token mechanism

2. **Security Features**
   - Password hashing (bcrypt)
   - Email verification
   - Account status tracking
   - Rate limiting
   - File validation

## User Flows and Journeys

### Roles Overview
1. **GPO (Government Procurement Officer)**
   - Primary administrator role
   - Manages RFPs and vendor evaluations
   - Access to AI-powered analysis tools
   - Blockchain transaction verification

2. **Vendor**
   - Business entity submitting bids
   - Access to AI proposal analysis
   - Verification required
   - Blockchain-verified submissions

### System Initialization
1. **First-time Setup**
   - System starts with no users
   - First GPO account must be created via `/admin/initialize`
   - This GPO becomes the primary administrator

### GPO Journey

1. **Account Creation & Access**
   - Initial GPO created during system setup
   - Additional GPOs can be created by existing GPOs
   - Login using email/password

2. **RFP Management Flow**
   a. **RFP Creation**
      - Create categories
      - Upload RFP document
      - AI-powered information extraction
      - Manual review and adjustment
      - Blockchain logging
   
   b. **Document Processing**
      - PDF text extraction
      - RAG-enhanced analysis
      - Structured information parsing
      - Automatic form population
   
   c. **Publication Process**
      - Review extracted information
      - Set deadlines and timelines
      - Blockchain transaction verification
      - Public visibility management

2. **Bid Evaluation Flow**
   a. **Before Deadline**
      - Monitor submissions
      - View preliminary AI analysis
      - Track blockchain verification
   
   b. **After Deadline**
      - Access RAG-enhanced evaluations
      - Compare bid scores
      - Review AI recommendations
      - Verify blockchain records

### Vendor Journey

1. **Registration & Verification**
   - Register with business details
   - Submit business registration for verification
   - Receive verification email
   - Complete verification process
   - Login to access full features

2. **RFP Discovery & Analysis**
   - Browse available RFPs
   - Filter RFPs by category and status
   - View detailed RFP requirements
   - See clear submission deadlines with timezone
   - Track time remaining until deadlines

3. **Bid Preparation**
   a. **Document Analysis**
      - Upload draft proposal
      - Receive AI-powered analysis
      - Get improvement suggestions
      - Save draft versions
   
   b. **AI Assistance**
      - Technical compliance check
      - Budget analysis
      - Timeline assessment
      - Documentation completeness

2. **Submission Process**
   a. **Final Submission**
      - Submit proposal
      - Receive blockchain verification
      - Get submission confirmation
      - Track transaction status

   b. **Post-Submission**
      - View submission details
      - Access AI evaluation results
      - Track blockchain verification
      - Monitor status updates

### Public User Journey

1. **RFP Browsing**
   - View all published RFPs
   - See submission deadlines in local timezone
   - Filter by category and status
   - Access detailed RFP information

2. **Bid Transparency**
   - View number of submitted bids per RFP
   - Before deadline: see only vendor business names
   - After deadline: access bid scores and short evaluations
   - Cannot access detailed bid information or documents

### Expected Frontend Pages

#### Public Pages
1. **Landing Page**
   - System overview and features
   - Registration/Login options
   - Public RFP listing preview
   - Active contracts showcase
   - Clear role-based entry points (GPO/Vendor)

2. **Public RFP Browser**
   - Filterable RFP grid/list
   - Status indicators (Draft/Published/Closed)
   - Basic RFP details preview
   - Submission deadline information
   - Category-based filtering

3. **Public Contract Browser**
   - List of all awarded contracts
   - Basic contract information display
   - Milestone progress indicators
   - Search and filter capabilities
   - Link to detailed contract view

4. **Contract Detail View (Public)**
   - Complete contract information
   - RFP reference and details
   - Awarded vendor information
   - Timeline visualization
   - Milestone list with status
   - Public milestone updates feed

#### GPO Dashboard
1. **Overview Dashboard**
   - Active RFPs summary
   - Recent contract awards
   - Upcoming milestone deadlines
   - Quick action buttons
   - System statistics

2. **RFP Management**
   - RFP creation and editing
   - Draft RFP listing
   - Publication controls
   - Category management
   - Bid evaluation overview

3. **Contract Award Interface**
   - RFP selection
   - Bid comparison view
   - Evaluation scores display
   - Contract details form
     - Start/End dates
     - Award confirmation
   - Award status tracking

4. **Contract Management**
   - List of awarded contracts
   - Contract status tracking
   - Milestone creation interface
   - Progress monitoring
   - Vendor update notifications

5. **Milestone Management**
   - Milestone creation form
   - Due date management
   - Status tracking
   - Update history view
   - Media attachment viewer

#### Vendor Dashboard
1. **Overview Dashboard**
   - Active bids status
   - Awarded contracts summary
   - Upcoming milestone deadlines
   - Recent updates feed
   - Quick action buttons

2. **RFP and Bid Management**
   - Available RFPs listing
   - Bid submission interface
   - Evaluation results view
   - Award notifications
   - Contract acceptance

3. **Contract Portfolio**
   - List of awarded contracts
   - Contract details view
   - Milestone progress tracking
   - Update submission interface
   - Historical performance view

4. **Milestone Updates**
   - Milestone status overview
   - Update submission form
     - Status selection
     - Progress details
     - Media upload
   - Update history
   - Timeline visualization

#### Common Components
1. **Navigation**
   - Role-based menu system
   - Quick access shortcuts
   - Notification center
   - Profile management
   - Search functionality

2. **Contract Views**
   - Contract summary cards
   - Detailed contract view
   - Milestone progress bars
   - Status indicators
   - Action buttons

3. **Milestone Components**
   - Milestone cards
   - Progress indicators
   - Update submission forms
   - Media attachment handling
   - Timeline display

4. **Document Management**
   - File upload interface
   - Document preview
   - Download management
   - Version tracking
   - Media gallery

5. **Status Indicators**
   - RFP status badges
   - Contract status indicators
   - Milestone progress visualization
   - Update status markers
   - Timeline indicators

## API Endpoints

### RFP Management
1. **Information Extraction**
   ```
   POST /api/rfps/extract-info
   Content-Type: multipart/form-data
   Authorization: Bearer <token>
   
   Body:
   - document: PDF file (max 10MB)
   
   Response:
   {
     "message": "Information extracted successfully",
     "data": {
       "title": string,
       "shortDescription": string,
       "timeline": {
         "startDate": ISO8601 string,
         "endDate": ISO8601 string
       },
       "budget": number,
       ...
     }
   }
   ```

2. **Bid Analysis**
   ```
   POST /api/bids/analyze
   Content-Type: multipart/form-data
   Authorization: Bearer <token>
   
   Body:
   - document: PDF file
   - rfpId: string
   
   Response:
   {
     "message": "Proposal analyzed successfully",
     "analysis": {
       "technicalCompliance": {
         "score": number,
         "findings": string[],
         "recommendations": string[]
       },
       ...
     }
   }
   ```

## Implementation Guidelines

### 1. AI Integration
1. **RAG Implementation**
   - Chunk size: 1000 tokens
   - Overlap: 200 tokens
   - Top k: 5 relevant chunks
   - Rate limiting: 2-second intervals

2. **Document Processing**
   - PDF parsing with pdf-parse
   - Text extraction optimization
   - Error handling
   - Cleanup procedures

3. **Response Handling**
   - JSON validation
   - Error recovery
   - Logging
   - Performance monitoring

### 2. Security Measures
1. **File Handling**
   - Size limits (10MB)
   - Type validation
   - Secure storage
   - Automatic cleanup

2. **API Protection**
   - Rate limiting
   - Input validation
   - Error handling
   - Session management

### 3. Performance Optimization
1. **LLM Usage**
   - Token batching
   - Response caching
   - Error retry logic
   - Rate limit management

2. **RAG Efficiency**
   - Embedding caching
   - Vector search optimization
   - Chunk management
   - Context prioritization

3. **Blockchain Integration**
   - Asynchronous logging
   - Transaction batching
   - Gas optimization
   - Error recovery

## Error Handling

### 1. Common Errors
1. **File Processing**
   - Invalid file type
   - File size exceeded
   - Corrupt PDF
   - Text extraction failure

2. **AI Processing**
   - Token limit exceeded
   - Rate limiting
   - Invalid response format
   - Context overflow

3. **Blockchain**
   - Transaction failure
   - Gas estimation error
   - Network issues
   - Contract errors

### 2. Error Recovery
1. **Automatic Retry**
   - Rate limit backoff
   - Transaction resubmission
   - API call retry
   - Connection recovery

2. **Fallback Mechanisms**
   - Alternative processing paths
   - Cached responses
   - Default values
   - Manual intervention triggers

## Monitoring and Logging

### 1. System Metrics
1. **Performance**
   - Response times
   - Token usage
   - API latency
   - Resource utilization

2. **Usage Statistics**
   - API calls
   - File processing
   - AI requests
   - Blockchain transactions

### 2. Error Tracking
1. **Log Categories**
   - API errors
   - Processing failures
   - Security incidents
   - Performance issues

2. **Alert Thresholds**
   - Error rates
   - Response times
   - Resource usage
   - Security events

## Future Considerations

### 1. AI Enhancements
1. **Model Improvements**
   - Custom fine-tuning
   - Domain adaptation
   - Performance optimization
   - Response quality

2. **RAG Optimization**
   - Improved chunking
   - Better context selection
   - Enhanced embedding
   - Historical learning

### 2. Blockchain Integration
1. **Smart Contracts**
   - Advanced features
   - Gas optimization
   - Cross-chain support
   - Automated verification

2. **Transaction Management**
   - Batch processing
   - Cost optimization
   - Speed improvements
   - Recovery mechanisms

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## Response Format
All responses follow this general format:
```json
{
    "message": "Status message",
    "data": {}, // Response data (if any)
    "error": "Error message" // (if applicable)
}
```

## Endpoints

### Authentication

#### Register Vendor
- **POST** `/auth/register`
- **Description**: Register a new vendor account
- **Body**:
```json
{
    "businessName": "string (required)",
    "name": "string (required)",
    "email": "string (required, valid email)",
    "password": "string (required, min 8 characters)"
}
```
- **Success Response** (201):
```json
{
    "message": "Vendor registered successfully",
    "token": "jwt_token",
    "user": {
        "id": "uuid",
        "businessName": "string",
        "name": "string",
        "email": "string",
        "role": "VENDOR",
        "isVerified": false,
        "createdAt": "ISO date string"
    }
}
```
- **Error Responses**:
  - 400: "User already exists" | "Invalid input data"
  - 500: "Internal server error"

#### Login
- **POST** `/auth/login`
- **Body**:
```json
{
    "email": "string (required)",
    "password": "string (required)"
}
```
- **Success Response** (200):
```json
{
    "token": "jwt_token",
    "user": {
        "id": "uuid",
        "name": "string",
        "email": "string",
        "role": "VENDOR | GPO",
        "isVerified": "boolean",
        "createdAt": "ISO date string"
    }
}
```
- **Error Responses**:
  - 401: "Invalid credentials"
  - 500: "Internal server error"

#### Get Profile
- **GET** `/auth/profile`
- **Auth Required**: Yes
- **Success Response** (200):
```json
{
    "data": {
        "id": "uuid",
        "name": "string",
        "email": "string",
        "role": "VENDOR | GPO",
        "businessName": "string (if VENDOR)",
        "isVerified": "boolean",
        "createdAt": "ISO date string"
    }
}
```
- **Error Responses**:
  - 401: "Authentication required"
  - 404: "User not found"

### Business Verification

#### Request Verification
- **POST** `/vendor/verification/request`
- **Auth Required**: Yes (Vendor only)
- **Body**:
```json
{
    "businessRegistrationNumber": "string (required)"
}
```
- **Success Response** (200):
```json
{
    "message": "Verification email sent to registered business email",
    "businessEmail": "string"
}
```
- **Error Responses**:
  - 400: "Invalid business registration" | "Vendor is already verified"
  - 401: "Authentication required"
  - 403: "Only vendors can request verification"

#### Verify Business
- **GET** `/vendor/verification/verify/:token`
- **Parameters**:
  - token: Verification token received via email
- **Success Response** (200):
```json
{
    "message": "Business verified successfully",
    "isVerified": true
}
```
- **Error Responses**:
  - 400: "Invalid verification token" | "Token expired"
  - 404: "Token not found"

### RFP Management

#### Create Category
- **POST** `/rfp/categories/create`
- **Auth Required**: Yes (GPO only)
- **Body**:
```json
{
    "name": "string (required, unique)",
    "description": "string (optional)"
}
```
- **Success Response** (201):
```json
{
    "message": "Category created successfully",
    "data": {
        "id": "uuid",
        "name": "string",
        "description": "string",
        "createdAt": "ISO date string"
    }
}
```
- **Error Responses**:
  - 400: "Category already exists"
  - 403: "Only GPOs can create categories"

#### List Categories
- **GET** `/rfp/categories`
- **Success Response** (200):
```json
{
    "data": [
        {
            "id": "uuid",
            "name": "string",
            "description": "string",
            "createdAt": "ISO date string"
        }
    ]
}
```

#### Create RFP
- **POST** `/rfp/create`
- **Auth Required**: Yes (GPO only)
- **Body**:
```json
{
    "title": "string (required)",
    "shortDescription": "string (required)",
    "timeline": {
        "startDate": "ISO 8601 datetime (required, e.g., 2024-03-21T00:00:00Z)",
        "endDate": "ISO 8601 datetime (required, e.g., 2024-06-21T23:59:59Z)"
    },
    "budget": "number (required)",
    "submissionDeadline": "ISO 8601 datetime (required, e.g., 2024-04-21T17:00:00Z)",
    "categoryId": "uuid (required)",
    "technicalRequirements": ["string"],
    "managementRequirements": ["string"],
    "pricingDetails": "string",
    "evaluationCriteria": {
        "metrics": [
            {
                "name": "string",
                "weightage": "number (0-100)"
            }
        ]
    },
    "specialInstructions": "string"
}
```
- **Success Response** (201):
```json
{
    "message": "RFP created successfully",
    "data": {
        "id": "uuid",
        "title": "string",
        "shortDescription": "string",
        "longDescription": "string (AI-generated)",
        "timelineStartDate": "ISO 8601 datetime",
        "timelineEndDate": "ISO 8601 datetime",
        "budget": "number",
        "issueDate": null,
        "submissionDeadline": "ISO 8601 datetime",
        "categoryId": "uuid",
        "status": "DRAFT",
        "isPublished": false,
        "createdAt": "ISO 8601 datetime",
        "updatedAt": "ISO 8601 datetime"
    }
}
```
- **Error Responses**:
  - 400: "Invalid submission deadline format" | "Submission deadline must be in the future" | "Invalid category"
  - 403: "Only GPOs can create RFPs"

#### List RFPs
- **GET** `/rfp/list`
- **Query Parameters**:
  - status: "DRAFT" | "PUBLISHED" | "CLOSED" (optional)
  - categoryId: uuid (optional)
  - page: number (default: 1)
  - limit: number (default: 10)
- **Success Response** (200):
```json
{
    "data": [
        {
            "id": "uuid",
            "title": "string",
            "shortDescription": "string",
            "budget": "number",
            "issueDate": "ISO 8601 datetime | null",
            "submissionDeadline": "ISO 8601 datetime",
            "timelineStartDate": "ISO 8601 datetime",
            "timelineEndDate": "ISO 8601 datetime",
            "status": "DRAFT | PUBLISHED | CLOSED",
            "category": {
                "id": "uuid",
                "name": "string"
            },
            "createdBy": {
                "id": "uuid",
                "name": "string",
                "email": "string"
            },
            "createdAt": "ISO 8601 datetime",
            "updatedAt": "ISO 8601 datetime"
        }
    ],
    "pagination": {
        "currentPage": "number",
        "totalPages": "number",
        "totalItems": "number",
        "itemsPerPage": "number"
    }
}
```

#### Get RFP Details
- **GET** `/rfp/:id`
- **Success Response** (200):
```json
{
    "data": {
        "id": "uuid",
        "title": "string",
        "shortDescription": "string",
        "longDescription": "string",
        "timelineStartDate": "ISO 8601 datetime",
        "timelineEndDate": "ISO 8601 datetime",
        "budget": "number",
        "issueDate": "ISO 8601 datetime | null",
        "submissionDeadline": "ISO 8601 datetime",
        "status": "DRAFT | PUBLISHED | CLOSED",
        "isPublished": "boolean",
        "category": {
            "id": "uuid",
            "name": "string"
        },
        "createdBy": {
            "id": "uuid",
            "name": "string",
            "email": "string"
        },
        "createdAt": "ISO 8601 datetime",
        "updatedAt": "ISO 8601 datetime"
    }
}
```
- **Error Response**:
  - 404: "RFP not found"

#### Publish RFP
- **PATCH** `/rfp/:id/publish`
- **Auth Required**: Yes (GPO only)
- **Description**: Publishes an RFP and automatically sets the issue date to the current time
- **Success Response** (200):
```json
{
    "message": "RFP published successfully",
    "data": {
        "id": "uuid",
        "title": "string",
        "status": "PUBLISHED",
        "isPublished": true,
        "issueDate": "ISO 8601 datetime"
    }
}
```
- **Error Responses**:
  - 400: "RFP is already published"
  - 403: "Only GPOs can publish RFPs" | "Only the GPO who created this RFP can publish it"
  - 404: "RFP not found"

### Date Format Notes
1. All datetime fields use ISO 8601 format (e.g., "2024-03-21T15:00:00Z")
2. Timezone is always UTC (denoted by 'Z' suffix)
3. Issue date:
   - Null when RFP is created
   - Automatically set to current time when RFP is published
4. Submission deadline:
   - Must include time component
   - Must be in the future
   - Example: "2024-04-21T17:00:00Z" (5 PM UTC)
5. Timeline dates:
   - Start date typically uses 00:00:00Z (start of day)
   - End date typically uses 23:59:59Z (end of day)

### Bid Management

#### Analyze Bid Proposal
- **POST** `/bids/rfp/:rfpId/analyze`
- **Auth Required**: Yes (Vendor only)
- **Content-Type**: multipart/form-data
- **Body**:
  - proposalDocument: PDF file (max 10MB)
- **Success Response** (200):
```json
{
    "message": "Proposal analyzed successfully",
    "analysis": {
        "suggestions": {
            "budget": ["string"],
            "technical": ["string"],
            "timeline": ["string"],
            "team": ["string"],
            "documentation": ["string"]
        },
        "isComplete": "boolean",
        "score": "number (0-100)"
    }
}
```
- **Error Responses**:
  - 400: "Proposal document is required" | "Invalid file format"
  - 403: "Only vendors can analyze proposals" | "Account must be verified"

#### Submit Bid
- **POST** `/bids/rfp/:rfpId/submit`
- **Auth Required**: Yes (Vendor only)
- **Content-Type**: multipart/form-data
- **Body**:
  - proposalDocument: PDF file (max 10MB)
- **Success Response** (201):
```json
{
    "message": "Bid submitted successfully",
    "bid": {
        "id": "uuid",
        "status": "SUBMITTED",
        "submissionDate": "ISO date string",
        "documentUrl": "string (URL to download document)"
    }
}
```
- **Error Responses**:
  - 400: "Proposal document is required" | "Already submitted a bid"
  - 403: "Only vendors can submit bids" | "Account must be verified"

#### Save Draft Bid
- **POST** `/bids/rfp/:rfpId/draft`
- **Auth Required**: Yes (Vendor only)
- **Content-Type**: multipart/form-data
- **Body**:
  - proposalDocument: PDF file (max 10MB)
- **Success Response** (200):
```json
{
    "message": "Draft saved successfully",
    "bid": {
        "id": "uuid",
        "status": "DRAFT",
        "updatedAt": "ISO date string"
    }
}
```
- **Error Responses**:
  - 400: "Proposal document is required"
  - 403: "Only vendors can save bid drafts"

#### List Bids for RFP
- **GET** `/bids/rfp/:rfpId/list`
- **Auth Required**: Yes (GPO only)
- **Query Parameters**:
  - page: number (default: 1)
  - limit: number (default: 10)
- **Success Response** (200):
```json
{
    "data": [
        {
            "id": "uuid",
            "status": "SUBMITTED",
            "submissionDate": "ISO date string",
            "vendor": {
                "id": "uuid",
                "name": "string",
                "businessName": "string",
                "businessEmail": "string"
            }
        }
    ],
    "pagination": {
        "currentPage": "number",
        "totalPages": "number",
        "totalItems": "number",
        "itemsPerPage": "number"
    },
    "message": "Note: Bid documents will be available after the submission deadline"
}
```
- **Error Responses**:
  - 403: "Only GPOs can list bids"
  - 404: "RFP not found"

#### Get Bid Details
- **GET** `/bids/rfp/:rfpId/bid/:id`
- **Auth Required**: Yes (GPO after deadline or bid owner)
- **Success Response** (200):
```json
{
    "data": {
        "id": "uuid",
        "status": "DRAFT | SUBMITTED",
        "submissionDate": "ISO date string",
        "vendor": {
            "id": "uuid",
            "name": "string",
            "businessName": "string",
            "businessEmail": "string"
        },
        "rfp": {
            "id": "uuid",
            "title": "string",
            "submissionDeadline": "ISO date string"
        }
    }
}
```
- **Error Responses**:
  - 403: "Access denied" | "Can only be viewed after submission deadline"
  - 404: "Bid not found"

#### Download Bid Document
- **GET** `/bids/rfp/:rfpId/bid/:id/document`
- **Auth Required**: Yes (GPO after deadline or bid owner)
- **Success Response**: PDF file download
- **Error Responses**:
  - 403: "Access denied" | "Can only be downloaded after submission deadline"
  - 404: "Bid not found" | "Proposal document not found"

### Admin Management

#### Initialize First GPO
- **POST** `/admin/initialize`
- **Description**: One-time initialization to create first GPO account
- **Body**:
```json
{
    "name": "string (required)",
    "email": "string (required)",
    "password": "string (required, min 8 characters)"
}
```
- **Success Response** (201):
```json
{
    "message": "First GPO account created successfully",
    "token": "jwt_token",
    "user": {
        "id": "uuid",
        "name": "string",
        "email": "string",
        "role": "GPO"
    }
}
```
- **Error Responses**:
  - 400: "Email already exists"
  - 403: "System already initialized with a GPO account"

#### Create Additional GPO
- **POST** `/admin/gpo`
- **Auth Required**: Yes (GPO only)
- **Body**:
```json
{
    "name": "string (required)",
    "email": "string (required)",
    "password": "string (required, min 8 characters)"
}
```
- **Success Response** (201):
```json
{
    "message": "GPO account created successfully",
    "user": {
        "id": "uuid",
        "name": "string",
        "email": "string",
        "role": "GPO"
    }
}
```
- **Error Responses**:
  - 400: "User already exists"
  - 403: "Only GPOs can create additional GPO accounts"

## File Upload Requirements
- File uploads must be PDF format
- Maximum file size: 10MB
- Filename length must not exceed 255 characters

## Error Handling
Common error status codes:
- 400: Bad Request (Invalid input)
- 401: Unauthorized (Missing authentication)
- 403: Forbidden (Insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

## Frontend Integration Guidelines
1. **Authentication Flow**:
   - Store JWT token securely (e.g., in HttpOnly cookies)
   - Include token in all authenticated requests
   - Handle token expiration (24 hours)

2. **File Uploads**:
   - Use multipart/form-data for file uploads
   - Implement file type and size validation
   - Show upload progress indicators

3. **Error Handling**:
   - Display appropriate error messages
   - Implement retry mechanisms for failed requests
   - Handle network errors gracefully

4. **Real-time Updates**:
   - Implement polling for bid status updates
   - Refresh data after successful operations

5. **User Experience**:
   - Implement loading states
   - Add form validation
   - Show success/error notifications
   - Implement confirmation dialogs for important actions

## Contract and Milestone Management

### API Endpoints

#### Contract Management

1. **Award Contract to Bid**
```http
POST /api/contracts/rfp/:rfpId/bid/:bidId/award
Authorization: Bearer <jwt_token>
Role Required: GPO

Request Body:
{
    "startDate": "2024-03-20T00:00:00.000Z",
    "endDate": "2024-09-20T00:00:00.000Z"
}

Response (201 Created):
{
    "message": "Contract awarded successfully",
    "data": {
        "contract": {
            "id": "9b4c6293-8720-4cb1-8726-cf5db95e7f2d",
            "rfpId": "550e8400-e29b-41d4-a716-446655440000",
            "bidId": "7a39e6b6-b77e-4a6c-8f79-8061c5c23cf1",
            "vendorId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            "status": "ACTIVE",
            "startDate": "2024-03-20T00:00:00.000Z",
            "endDate": "2024-09-20T00:00:00.000Z",
            "awardDate": "2024-01-26T04:58:41.897Z",
            "totalValue": 150000.00
        },
        "vendor": {
            "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            "name": "Tech Solutions Inc."
        },
        "rfp": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "title": "Cloud Infrastructure Setup",
            "status": "CLOSED"
        }
    }
}
```

2. **Get Contract Details**
```http
GET /api/contracts/:id
Public Access

Response (200 OK):
{
    "data": {
        "id": "9b4c6293-8720-4cb1-8726-cf5db95e7f2d",
        "rfpId": "550e8400-e29b-41d4-a716-446655440000",
        "bidId": "7a39e6b6-b77e-4a6c-8f79-8061c5c23cf1",
        "vendorId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "status": "ACTIVE",
        "startDate": "2024-03-20T00:00:00.000Z",
        "endDate": "2024-09-20T00:00:00.000Z",
        "rfp": {
            "title": "Cloud Infrastructure Setup"
        },
        "vendor": {
            "name": "Tech Solutions Inc."
        },
        "milestones": [...]
    }
}
```

3. **List All Contracts**
```http
GET /api/contracts?page=1&limit=10
Public Access

Response (200 OK):
{
    "data": [...],
    "pagination": {
        "currentPage": 1,
        "totalPages": 5,
        "totalItems": 48,
        "itemsPerPage": 10
    }
}
```

4. **Get Vendor's Contracts**
```http
GET /api/contracts/vendor/contracts
Authorization: Bearer <jwt_token>
Role Required: VENDOR

Response (200 OK):
{
    "data": [
        {
            "id": "9b4c6293-8720-4cb1-8726-cf5db95e7f2d",
            "rfp": {
                "title": "Cloud Infrastructure Setup"
            },
            "status": "ACTIVE",
            "startDate": "2024-03-20T00:00:00.000Z",
            "endDate": "2024-09-20T00:00:00.000Z",
            "milestones": [...]
        }
    ]
}
```

#### Milestone Management

1. **Create Milestone**
```http
POST /api/contracts/:contractId/milestones
Authorization: Bearer <jwt_token>
Role Required: GPO

Request Body:
{
    "title": "Initial Setup",
    "description": "Set up basic cloud infrastructure",
    "dueDate": "2024-04-20T00:00:00.000Z"
}

Response (201 Created):
{
    "message": "Milestone created successfully",
    "data": {
        "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
        "contractId": "9b4c6293-8720-4cb1-8726-cf5db95e7f2d",
        "title": "Initial Setup",
        "description": "Set up basic cloud infrastructure",
        "dueDate": "2024-04-20T00:00:00.000Z",
        "status": "NOT_STARTED"
    }
}
```

2. **List Contract Milestones**
```http
GET /api/contracts/:contractId/milestones
Public Access

Response (200 OK):
{
    "data": [
        {
            "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
            "title": "Initial Setup",
            "description": "Set up basic cloud infrastructure",
            "dueDate": "2024-04-20T00:00:00.000Z",
            "status": "IN_PROGRESS",
            "updates": [...]
        }
    ]
}
```

3. **Add Milestone Update**
```http
POST /api/contracts/:contractId/milestones/:milestoneId/updates
Authorization: Bearer <jwt_token>
Role Required: VENDOR

Request Body:
{
    "status": "IN_PROGRESS",
    "details": "Completed server provisioning, starting configuration",
    "media": ["https://storage.example.com/screenshots/config1.png"]
}

Response (201 Created):
{
    "message": "Milestone update added successfully",
    "data": {
        "id": "e8fd159b-57c4-4d36-9bd7-a59ca13057bb",
        "status": "IN_PROGRESS",
        "details": "Completed server provisioning, starting configuration",
        "media": ["https://storage.example.com/screenshots/config1.png"],
        "updatedById": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "createdAt": "2024-03-25T14:30:00.000Z"
    }
}
```

4. **Get Milestone Updates**
```http
GET /api/contracts/:contractId/milestones/:milestoneId/updates
Public Access

Response (200 OK):
{
    "data": [
        {
            "id": "e8fd159b-57c4-4d36-9bd7-a59ca13057bb",
            "status": "IN_PROGRESS",
            "details": "Completed server provisioning, starting configuration",
            "media": ["https://storage.example.com/screenshots/config1.png"],
            "updatedBy": {
                "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
                "name": "Tech Solutions Inc."
            },
            "createdAt": "2024-03-25T14:30:00.000Z",
            "updatedAt": "2024-03-25T14:30:00.000Z"
        }
    ]
}
```

### User Journeys

#### GPO (Government Procurement Officer)

1. **Contract Award Process**
   - Review RFP bids and evaluations
   - Select winning bid
   - Award contract by providing start and end dates
   - System automatically:
     - Creates contract
     - Updates RFP status to CLOSED
     - Records award details

2. **Project Monitoring**
   - Create milestones for awarded contracts
   - View milestone updates from vendors
   - Track project progress through milestone statuses
   - Access all contract details and updates

#### Vendor

1. **Contract Award Notification**
   - Submit bid for RFP
   - Receive evaluation score
   - Check RFP status for award decision
   - If awarded:
     - Access contract details
     - View project milestones
     - Start updating milestone progress

2. **Project Management**
   - View all awarded contracts in dashboard
   - Access individual contract details
   - Update milestone progress with:
     - Status changes
     - Detailed updates
     - Supporting media/documents
   - Track historical updates

#### Public Users

1. **Transparency Access**
   - View all awarded contracts
   - Access contract details including:
     - RFP information
     - Awarded vendor
     - Contract value and timeline
   - Track project progress through milestones
   - View milestone updates and history

### Frontend Implementation Guide

#### Dashboard Views

1. **GPO Dashboard**
   - List of RFPs with status
   - Awarded contracts section
   - Milestone tracking overview
   - Quick actions:
     - Award contract
     - Create milestone
     - View updates

2. **Vendor Dashboard**
   - Active bids status
   - Awarded contracts list
   - Milestone progress tracking
   - Quick actions:
     - View contract details
     - Update milestones
     - Upload progress reports

3. **Public Dashboard**
   - Browse awarded contracts
   - Search and filter options
   - Project progress tracking
   - Transparency metrics

#### Key Features

1. **Contract Award Interface**
   - RFP selection
   - Bid evaluation display
   - Contract details form
   - Award confirmation

2. **Milestone Management**
   - Timeline view
   - Progress tracking
   - Update submission form
   - Media upload interface

3. **Progress Tracking**
   - Visual progress indicators
   - Status updates timeline
   - Document/media gallery
   - Historical data view

## Open Source Strategy

### 1. Model Selection
- **IBM Granite Models**
  - Open-source foundation models
  - Community-driven development
  - No vendor lock-in
  - Customizable for procurement needs

### 2. Future Enhancements
1. **Model Improvements**
   - Fine-tuning on procurement data
   - Custom embedding models
   - Domain-specific optimizations
   - Response quality metrics

2. **RAG Optimization**
   - Enhanced chunking strategies
   - Improved context selection
   - Vector store performance
   - Historical learning integration

3. **Research Integration**
   - Academic procurement papers
   - Industry best practices
   - Regulatory requirements
   - Case study learnings 