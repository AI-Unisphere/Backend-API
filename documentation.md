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
   - Create RFP categories for organization
   - Create new RFP with detailed requirements
   - Review and edit RFP in draft status
   - Publish RFP when ready for vendor submissions

3. **Bid Management Flow**
   - View all submitted bids for each RFP
   - Access bid details after submission deadline
   - Download and review proposal documents
   - Track vendor participation and submission status

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
   - Download RFP documents

3. **Bid Submission Flow**
   - Prepare proposal document (PDF)
   - Use AI analysis for proposal improvement
   - Save draft bids for later completion
   - Submit final bid before deadline
   - Track submitted bids and status

### Expected Frontend Pages

#### Public Pages
1. **Landing Page**
   - System overview
   - Registration/Login options
   - Featured RFPs

2. **Authentication Pages**
   - Login form
   - Registration form
   - Password recovery

#### GPO Dashboard
1. **Overview Dashboard**
   - Active RFPs summary
   - Recent bid submissions
   - System statistics

2. **RFP Management**
   - RFP listing page with filters
   - RFP creation form
   - RFP detail view
   - RFP edit page
   - Category management

3. **Bid Review**
   - Bid listing by RFP
   - Bid detail view
   - Proposal document viewer
   - Vendor information view

4. **Administration**
   - GPO account management
   - System settings
   - User management

#### Vendor Dashboard
1. **Overview Dashboard**
   - Available RFPs
   - Draft bids
   - Submitted bids status
   - Verification status

2. **RFP Discovery**
   - RFP search and filter
   - RFP detail view
   - Category-based browsing

3. **Bid Management**
   - Bid creation form
   - Draft bids listing
   - Submission history
   - AI analysis results view

4. **Profile Management**
   - Business profile
   - Verification status
   - Document management

### Common Features Across All Pages
1. **Navigation**
   - Role-based menu
   - Quick access to key functions
   - Breadcrumb navigation

2. **Notifications**
   - System alerts
   - Deadline reminders
   - Status updates

3. **Document Handling**
   - File upload interface
   - Document preview
   - Download management

4. **User Interface Elements**
   - Loading states
   - Error messages
   - Success confirmations
   - Modal dialogs
   - Form validations

### Data Flow Considerations
1. **Authentication**
   - JWT token management
   - Session handling
   - Role-based access control

2. **File Operations**
   - Client-side file validation
   - Upload progress tracking
   - Download handling

3. **Real-time Updates**
   - Status change notifications
   - Deadline alerts
   - New submission notifications

4. **Data Caching**
   - RFP list caching
   - User profile caching
   - Category list caching

### Mobile Responsiveness
All pages should be responsive with:
1. **Adaptive Layouts**
   - Flexible grids
   - Responsive tables
   - Mobile-friendly forms

2. **Touch Interactions**
   - Touch-friendly buttons
   - Swipe gestures
   - Mobile file handling

3. **Performance Optimization**
   - Lazy loading
   - Image optimization
   - Minimal network requests

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
        "startDate": "ISO date string (required)",
        "endDate": "ISO date string (required)"
    },
    "budget": "number (required)",
    "issueDate": "ISO date string (required)",
    "submissionDeadline": "ISO date string (required)",
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
        "timelineStartDate": "ISO date string",
        "timelineEndDate": "ISO date string",
        "budget": "number",
        "issueDate": "ISO date string",
        "submissionDeadline": "ISO date string",
        "categoryId": "uuid",
        "status": "DRAFT",
        "isPublished": false,
        "createdAt": "ISO date string"
    }
}
```
- **Error Responses**:
  - 400: "Invalid category" | "Invalid input data"
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
            "submissionDeadline": "ISO date string",
            "status": "DRAFT | PUBLISHED | CLOSED",
            "category": {
                "id": "uuid",
                "name": "string"
            },
            "createdBy": {
                "id": "uuid",
                "name": "string",
                "email": "string"
            }
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
        "timelineStartDate": "ISO date string",
        "timelineEndDate": "ISO date string",
        "budget": "number",
        "issueDate": "ISO date string",
        "submissionDeadline": "ISO date string",
        "status": "DRAFT | PUBLISHED | CLOSED",
        "category": {
            "id": "uuid",
            "name": "string"
        },
        "createdBy": {
            "id": "uuid",
            "name": "string",
            "email": "string"
        }
    }
}
```
- **Error Response**:
  - 404: "RFP not found"

#### Publish RFP
- **PATCH** `/rfp/:id/publish`
- **Auth Required**: Yes (GPO only)
- **Success Response** (200):
```json
{
    "message": "RFP published successfully",
    "data": {
        "id": "uuid",
        "title": "string",
        "status": "PUBLISHED",
        "isPublished": true
    }
}
```
- **Error Responses**:
  - 400: "RFP is already published"
  - 403: "Only the GPO who created this RFP can publish it"
  - 404: "RFP not found"

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