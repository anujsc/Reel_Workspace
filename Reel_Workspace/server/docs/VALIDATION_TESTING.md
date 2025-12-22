# Validation & Error Handling Testing Guide

## Overview

This guide provides comprehensive test cases for validating the error handling and validation layer implementation.

---

## Table of Contents

1. [Authentication Validation Tests](#authentication-validation-tests)
2. [Reel Validation Tests](#reel-validation-tests)
3. [Folder Validation Tests](#folder-validation-tests)
4. [Search & Filter Tests](#search--filter-tests)
5. [Error Handling Tests](#error-handling-tests)
6. [Edge Cases](#edge-cases)

---

## Authentication Validation Tests

### Test 1: Register - Missing Email

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "password": "Test1234"
  }'
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Email is required",
      "code": "VALIDATION_ERROR"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/auth/register"
}
```

### Test 2: Register - Invalid Email Format

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "Test1234"
  }'
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

### Test 3: Register - Weak Password

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "weak"
  }'
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters long",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

### Test 4: Register - Password Without Uppercase

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test1234"
  }'
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

### Test 5: Register - Duplicate Email

```bash
# First registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'

# Second registration with same email
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

**Expected Response (409):**

```json
{
  "success": false,
  "message": "Duplicate value for field: email",
  "code": "DUPLICATE_KEY_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "email 'test@example.com' already exists",
      "code": "DUPLICATE_KEY"
    }
  ]
}
```

### Test 6: Login - Invalid Credentials

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword123"
  }'
```

**Expected Response (401):**

```json
{
  "success": false,
  "message": "Invalid email or password",
  "code": "AUTHENTICATION_ERROR",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/auth/login"
}
```

---

## Reel Validation Tests

### Test 7: Extract Reel - Missing Instagram URL

```bash
curl -X POST http://localhost:5000/api/reel/extract \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{}'
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "instagramUrl",
      "message": "Instagram URL is required",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

### Test 8: Extract Reel - Invalid Instagram URL Format

```bash
curl -X POST http://localhost:5000/api/reel/extract \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "instagramUrl": "https://youtube.com/watch?v=123"
  }'
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "instagramUrl",
      "message": "Invalid Instagram URL format. Must be a valid Instagram post/reel URL",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

### Test 9: Update Reel - Invalid ObjectId

```bash
curl -X PATCH http://localhost:5000/api/reel/invalid-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Updated Title"
  }'
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "id",
      "message": "Invalid id format",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

### Test 10: Update Reel - Title Too Long

```bash
curl -X PATCH http://localhost:5000/api/reel/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "This is a very long title that exceeds the maximum allowed length of 200 characters. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris."
  }'
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "title",
      "message": "Title must be between 1 and 200 characters",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

### Test 11: Update Reel - Too Many Tags

```bash
curl -X PATCH http://localhost:5000/api/reel/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12", "tag13", "tag14", "tag15", "tag16", "tag17", "tag18", "tag19", "tag20", "tag21"]
  }'
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "tags",
      "message": "Cannot have more than 20 tags",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

### Test 12: Update Reel - Invalid Folder ID

```bash
curl -X PATCH http://localhost:5000/api/reel/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "folderId": "invalid-folder-id"
  }'
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "folderId",
      "message": "Invalid folder ID format",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

---

## Folder Validation Tests

### Test 13: Create Folder - Missing Name

```bash
curl -X POST http://localhost:5000/api/folders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "color": "#3B82F6"
  }'
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "name",
      "message": "Folder name is required",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

### Test 14: Create Folder - Invalid Color Format

```bash
curl -X POST http://localhost:5000/api/folders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "My Folder",
    "color": "blue"
  }'
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "color",
      "message": "Invalid color format. Must be a hex color code (e.g., #3B82F6)",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

### Test 15: Create Folder - Name Too Long

```bash
curl -X POST http://localhost:5000/api/folders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "This is a very long folder name that exceeds the maximum allowed length of 50 characters"
  }'
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "name",
      "message": "Folder name must be between 1 and 50 characters",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

---

## Search & Filter Tests

### Test 16: Search - Missing Query Parameter

```bash
curl -X GET "http://localhost:5000/api/search" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "q",
      "message": "Search query parameter 'q' is required",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

### Test 17: Search - Query Too Short

```bash
curl -X GET "http://localhost:5000/api/search?q=a" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "q",
      "message": "Search query must be between 2 and 200 characters",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

### Test 18: Filter - No Filter Parameters

```bash
curl -X GET "http://localhost:5000/api/search/filter" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "message": "At least one filter parameter must be provided (folderId, tags, dateFrom, or dateTo)",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

### Test 19: Filter - Invalid Date Range

```bash
curl -X GET "http://localhost:5000/api/search/filter?dateFrom=2024-12-31&dateTo=2024-01-01" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "dateTo",
      "message": "dateFrom must be before dateTo",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

### Test 20: Pagination - Invalid Limit

```bash
curl -X GET "http://localhost:5000/api/reel?limit=150" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "limit",
      "message": "Limit must be a number between 1 and 100",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

---

## Error Handling Tests

### Test 21: JWT - Expired Token

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer EXPIRED_TOKEN"
```

**Expected Response (401):**

```json
{
  "success": false,
  "message": "Token has expired. Please login again",
  "code": "TOKEN_EXPIRED",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/auth/me"
}
```

### Test 22: JWT - Invalid Token

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer INVALID_TOKEN"
```

**Expected Response (401):**

```json
{
  "success": false,
  "message": "Invalid token. Please login again",
  "code": "INVALID_TOKEN",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/auth/me"
}
```

### Test 23: Authorization - Access Denied

```bash
# Try to update another user's reel
curl -X PATCH http://localhost:5000/api/reel/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_B_TOKEN" \
  -d '{
    "title": "Hacked Title"
  }'
```

**Expected Response (403):**

```json
{
  "success": false,
  "message": "Not authorized to update this reel",
  "code": "AUTHORIZATION_ERROR",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/reel/507f1f77bcf86cd799439011"
}
```

### Test 24: Not Found - Resource Doesn't Exist

```bash
curl -X GET http://localhost:5000/api/reel/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (404):**

```json
{
  "success": false,
  "message": "Reel not found",
  "code": "NOT_FOUND",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/reel/507f1f77bcf86cd799439011"
}
```

### Test 25: Route Not Found

```bash
curl -X GET http://localhost:5000/api/nonexistent \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (404):**

```json
{
  "success": false,
  "message": "Route /api/nonexistent not found",
  "code": "ROUTE_NOT_FOUND",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/nonexistent"
}
```

---

## Edge Cases

### Test 26: Multiple Validation Errors

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid",
    "password": "weak"
  }'
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "code": "VALIDATION_ERROR"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

### Test 27: Empty String Values

```bash
curl -X POST http://localhost:5000/api/folders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "   ",
    "color": "#3B82F6"
  }'
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "name",
      "message": "Folder name cannot be empty",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

### Test 28: SQL Injection Attempt

```bash
curl -X GET "http://localhost:5000/api/search?q='; DROP TABLE users; --" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": [],
  "message": "Search results",
  "meta": {
    "total": 0,
    "limit": 20,
    "skip": 0,
    "page": 1,
    "totalPages": 0,
    "hasMore": false,
    "hasPrevious": false
  }
}
```

_Note: Input is sanitized, no SQL injection occurs_

### Test 29: XSS Attempt

```bash
curl -X POST http://localhost:5000/api/folders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "<script>alert(\"XSS\")</script>",
    "color": "#3B82F6"
  }'
```

**Expected Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "scriptalert(\"XSS\")/script",
    "color": "#3B82F6"
  },
  "message": "Folder created successfully"
}
```

_Note: HTML tags are stripped by sanitization_

### Test 30: Very Large Payload

```bash
# Create a payload with 10MB of data
curl -X POST http://localhost:5000/api/reel/extract \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "instagramUrl": "https://instagram.com/reel/ABC123",
    "largeField": "'$(python3 -c "print('A' * 10000000)")'"
  }'
```

**Expected Response (413):**

```json
{
  "success": false,
  "message": "Payload too large",
  "code": "PAYLOAD_TOO_LARGE"
}
```

_Note: Express body parser should reject payloads exceeding configured limit_

---

## Automated Testing Script

Create a test script to run all validation tests:

```bash
#!/bin/bash

# validation-tests.sh
BASE_URL="http://localhost:5000"
TOKEN=""

echo "🧪 Running Validation Tests..."

# Test 1: Register with invalid email
echo "Test 1: Invalid email format"
curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":"Test1234"}' | jq

# Test 2: Register with weak password
echo "Test 2: Weak password"
curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"weak"}' | jq

# Add more tests...

echo "✅ All tests completed"
```

---

## Summary

This testing guide covers:

✅ **Authentication validation** - Email, password strength  
✅ **Reel validation** - Instagram URLs, ObjectIds, tags  
✅ **Folder validation** - Names, colors, formats  
✅ **Search & filter validation** - Query parameters, date ranges  
✅ **Error handling** - JWT, authorization, not found  
✅ **Edge cases** - Multiple errors, XSS, SQL injection  
✅ **Security** - Input sanitization, payload limits

All tests should return consistent, user-friendly error messages with proper HTTP status codes.
