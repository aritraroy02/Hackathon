# Authentication Implementation for Child Health Backend

## Overview

This implementation adds JWT-based authentication to the Child Health Backend while keeping the existing frontend authentication flow unchanged. The backend now mirrors the mock MOSIP authentication behavior with real JWT tokens and secure API endpoints.

## Features Implemented

### ✅ Backend Authentication Endpoints

1. **GET /api/auth/verify-uin/{uinNumber}**
   - Checks if UIN exists in demo users database
   - Returns masked user info (phone/email)
   - Returns 404 with "contact administration" message if UIN not found

2. **POST /api/auth/verify-otp**
   - Accepts any 6-digit OTP for demo purposes
   - Returns JWT token and complete user data
   - Token expires in 24 hours

3. **POST /api/auth/profile-upload** 
   - Auto-uploads user profile data after authentication
   - Updates user profile information

### ✅ Security Features

1. **JWT Token Validation Middleware**
   - Protects all child data endpoints
   - Validates token expiration and user status
   - Adds user context to requests

2. **Protected Endpoints**
   - All `/api/children/*` endpoints now require authentication
   - Bulk upload tracks who uploaded what data
   - User tracking fields added to child records

3. **Audit Trail**
   - All uploaded records include uploader information
   - Tracks: uploadedBy, uploaderUIN, uploaderEmployeeId, uploadedAt
   - Update tracking: lastUpdatedBy, lastUpdatedAt

### ✅ Demo User Database

4 demo users populated from frontend MOCK_MOSIP_DATA:
- **UIN: 1234567890** - ARITRADITYA ROY
- **UIN: 9876543210** - Jane Smith  
- **UIN: 5555555555** - Dr. Alice Johnson
- **UIN: 1111111111** - Health Worker Demo

### ✅ Frontend Integration

1. **Updated config/api.js**
   - Automatically includes JWT token in API requests
   - Reads token from AsyncStorage (eSignetAuthData)
   - New endpoints for authentication

2. **No Changes to ESignetAuthScreen.js**
   - Frontend authentication flow remains exactly the same
   - Mock behavior preserved for seamless user experience
   - Backend validates against real database now

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install jsonwebtoken bcryptjs node-fetch@2.6.7
```

### 2. Seed Demo Users
```bash
npm run seed-users
```

### 3. Start Server
```bash
npm start
```

### 4. Test Authentication
```bash
node test-auth.js          # Test basic auth flow
node test-complete-flow.js # Test complete data upload flow
```

## Usage Examples

### Authentication Flow
```javascript
// 1. Verify UIN
GET /api/auth/verify-uin/1234567890

// 2. Verify OTP (any 6-digit number)
POST /api/auth/verify-otp
{
  "uinNumber": "1234567890",
  "otp": "123456",
  "transactionId": "mock_transaction"
}

// 3. Use returned JWT token for data uploads
POST /api/children/bulk
Headers: { "Authorization": "Bearer <jwt_token>" }
```

### Frontend Integration
```javascript
// The makeRequest function automatically handles JWT tokens
import { makeRequest, API_ENDPOINTS } from './config/api';

// This will automatically include JWT token from AsyncStorage
const result = await makeRequest(API_ENDPOINTS.BULK_UPLOAD, 'POST', childrenData);
```

## Security Notes

- JWT secret should be in environment variables for production
- Demo accepts any 6-digit OTP - replace with real OTP verification
- User status (isActive) is checked on every request
- Tokens expire in 24 hours
- Protected endpoints return 401 for invalid/expired tokens

## Database Schema Updates

### User Model (New)
```javascript
{
  uinNumber: String (unique, 10 digits),
  name: String,
  email: String,
  phone: String,
  address: String,
  dateOfBirth: String,
  gender: String,
  photo: String,
  isActive: Boolean,
  employeeId: String
}
```

### Child Model (Updated)
```javascript
// Added user tracking fields:
{
  uploadedBy: String,
  uploaderUIN: String,
  uploaderEmployeeId: String,
  uploadedAt: String,
  lastUpdatedBy: String,
  lastUpdatedAt: String
}
```

## API Endpoints Summary

### Authentication (Public)
- `GET /api/auth/verify-uin/{uin}` - Check UIN exists
- `POST /api/auth/verify-otp` - Verify OTP & get token
- `POST /api/auth/profile-upload` - Upload user profile

### Child Data (Protected - Requires JWT)
- `GET /api/children` - List all children
- `POST /api/children` - Create single child record
- `GET /api/children/{healthId}` - Get specific child
- `PUT /api/children/{healthId}` - Update child record
- `DELETE /api/children/{healthId}` - Delete child record
- `POST /api/children/bulk` - Bulk upload (main endpoint)

### Health Check (Public)
- `GET /api/health` - Server health status
- `GET /` - API info and endpoints

## Test Results

✅ UIN verification working
✅ OTP verification with JWT token generation working  
✅ Protected endpoint access with JWT working
✅ Bulk upload with user tracking working
✅ Unauthorized access properly blocked
✅ Complete authentication + data upload flow working

The implementation successfully adds robust authentication while maintaining the existing frontend experience!
