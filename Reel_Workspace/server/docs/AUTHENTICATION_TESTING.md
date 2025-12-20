# Authentication System Testing Guide

## Phase 2 Complete - Authentication System

All authentication endpoints are now live and tested!

## API Endpoints

### Base URL

```
http://localhost:5000
```

### Authentication Endpoints

#### 1. Register User

**POST** `/api/auth/register`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "6946dccb483f2763fbfc9988",
      "email": "user@example.com",
      "createdAt": "2025-12-20T17:28:43.786Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

**Error Response (400) - Duplicate Email:**

```json
{
  "success": false,
  "message": "User already exists"
}
```

---

#### 2. Login User

**POST** `/api/auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "6946dccb483f2763fbfc9988",
      "email": "user@example.com",
      "createdAt": "2025-12-20T17:28:43.786Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

---

#### 3. Get Current User

**GET** `/api/auth/me`

**Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "6946dccb483f2763fbfc9988",
      "email": "user@example.com",
      "createdAt": "2025-12-20T17:28:43.786Z",
      "updatedAt": "2025-12-20T17:28:43.786Z"
    }
  },
  "message": "User retrieved successfully"
}
```

---

## Testing with cURL (Windows PowerShell)

### 1. Register a New User

```powershell
curl -Method POST -Uri "http://localhost:5000/api/auth/register" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"test@example.com","password":"test123"}'
```

### 2. Login

```powershell
curl -Method POST -Uri "http://localhost:5000/api/auth/login" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"test@example.com","password":"test123"}'
```

### 3. Get Current User (with token)

```powershell
# First, get the token from login
$response = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:5000/api/auth/login" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"test@example.com","password":"test123"}'

$token = $response.data.token

# Then use it to get user info
Invoke-RestMethod -Method GET `
  -Uri "http://localhost:5000/api/auth/me" `
  -Headers @{"Authorization"="Bearer $token"}
```

---

## Testing with Postman

See `POSTMAN_COLLECTION.json` in this folder for a complete Postman collection with:

- All authentication endpoints
- Automated test scripts
- Environment variable setup

### Setup Environment Variables

1. Create a new environment called "Reel Workspace Dev"
2. Add these variables:
   - `base_url`: `http://localhost:5000`
   - `authToken`: (leave empty, will be auto-set)

---

## Validation Checklist

✅ **All Tests Passed:**

- ✅ POST /api/auth/register creates user in MongoDB
- ✅ Password is hashed in database (not plain text)
- ✅ Duplicate email returns 400 error
- ✅ POST /api/auth/login returns JWT token
- ✅ Wrong password returns 401
- ✅ GET /api/auth/me with valid token returns user
- ✅ GET /api/auth/me without token returns 401
- ✅ User object never includes password field in responses
- ✅ All TypeScript types compile without errors
- ✅ Helmet security headers applied
- ✅ CORS configured properly
- ✅ Input validation working
- ✅ Error handling working correctly

---

## Security Features Implemented

1. **Password Hashing:** bcrypt with 10 salt rounds
2. **JWT Authentication:** Secure token-based auth
3. **Input Validation:** express-validator for all inputs
4. **Security Headers:** Helmet middleware
5. **CORS Protection:** Configured for development
6. **Password Exclusion:** Never sent in responses
7. **Generic Error Messages:** Don't reveal if email exists
8. **Token Expiration:** 7 days (configurable)

---

## MongoDB Verification

To verify passwords are hashed in the database:

1. Open MongoDB Compass or Atlas
2. Connect to your cluster
3. Navigate to `reelworkspace` database
4. Open `users` collection
5. Check that password field is a bcrypt hash (starts with `$2a$` or `$2b$`)

Example hashed password:

```
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

---

## Troubleshooting

### Issue: "User already exists"

**Solution:** Use a different email or delete the user from MongoDB

### Issue: "Invalid credentials"

**Solution:** Check email and password are correct

### Issue: "Not authorized, no token"

**Solution:** Include `Authorization: Bearer <token>` header

### Issue: "Token is not valid"

**Solution:** Token may be expired or malformed. Login again to get a new token

### Issue: Server not responding

**Solution:** Ensure server is running with `npm run dev`
