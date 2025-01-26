# UniSphere API Documentation

## User Flows and Journeys

### Roles Overview
1. **GPO (Government Procurement Officer)**
   - Primary administrator role
   - Manages RFPs and vendor evaluations
   - Can create other GPO accounts

2. **Vendor**
   - Business entity submitting bids
   - Requires verification before full access
   - Can submit and track proposals

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
      - Create RFP categories for organization
      - Create new RFP with detailed requirements
      - RFP starts in DRAFT status with null issue date
      - Set submission deadline with specific time (e.g., 5 PM UTC)
      - Define project timeline with start/end dates
   
   b. **RFP Review & Publication**
      - Review and edit RFP in draft status
      - Publish RFP when ready
      - System automatically sets issue date to current time
      - Publication triggers visibility to vendors

   c. **Timeline Management**
      - Monitor RFP deadlines
      - View countdown to submission deadline
      - Track project timeline dates

3. **Bid Management Flow**
   a. **Before Deadline**
      - View all submitted bids
      - See vendor business information
      - Cannot access bid details or evaluations
   
   b. **After Deadline**
      - Access full bid details
      - View AI-generated evaluations
      - Download proposal documents
      - Compare bid scores and analyses

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

3. **Bid Submission Flow**
   a. **Proposal Preparation**
      - Prepare proposal document (PDF)
      - Use AI analysis for proposal improvement
      - Save drafts for later completion
   
   b. **Submission Process**
      - Submit final bid before deadline
      - System enforces deadline cutoff
      - Receive confirmation with timestamp
   
   c. **Post-Submission**
      - Track submitted bids
      - View submission timestamps
      - After deadline: access evaluation results

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

### Implementation Guidelines

1. **Authentication Integration**
   - JWT token management
   - Role-based access control
   - Session handling
   - Secure route protection
   - Login/logout flow

2. **Form Handling**
   - Input validation
   - File upload progress
   - Error messaging
   - Success notifications
   - Auto-save functionality

3. **Data Management**
   - State management setup
   - API integration
   - Cache handling
   - Real-time updates
   - Error handling

4. **User Experience**
   - Loading states
   - Error boundaries
   - Toast notifications
   - Confirmation dialogs
   - Progressive loading

5. **Responsive Design**
   - Mobile-first approach
   - Breakpoint management
   - Touch interactions
   - Flexible layouts
   - Print-friendly views

### Key Features to Implement

1. **Contract Award Flow**
   ```
   RFP Selection -> Bid Review -> Award Form -> Confirmation -> Success
   ```

2. **Milestone Management Flow**
   ```
   Contract View -> Create Milestone -> Set Details -> Publish
   ```

3. **Update Submission Flow**
   ```
   Select Milestone -> Add Update -> Upload Media -> Submit
   ```

4. **Progress Tracking**
   ```
   View Contract -> Milestone List -> Update History -> Timeline View
   ```

5. **Document Handling**
   ```
   Upload -> Preview -> Process -> Confirm -> Store
   ```

### Technical Considerations

1. **State Management**
   - Contract data caching
   - Real-time updates
   - Form state persistence
   - User preferences
   - Authentication state

2. **API Integration**
   - Request interceptors
   - Error handling
   - Token management
   - Rate limiting
   - Cache invalidation

3. **Security Measures**
   - Route guards
   - Data encryption
   - Input sanitization
   - File validation
   - CSRF protection

4. **Performance**
   - Lazy loading
   - Code splitting
   - Image optimization
   - Cache strategies
   - Bundle optimization

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