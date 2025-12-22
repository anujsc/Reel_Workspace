# Validation & Error Handling Guide

## Overview

This guide covers the comprehensive validation and error handling system implemented in the Reel Workspace API. The system provides consistent, secure, and user-friendly error responses across all endpoints.

---

## Table of Contents

1. [Validation System](#validation-system)
2. [Error Handling](#error-handling)
3. [Response Formats](#response-formats)
4. [Usage Examples](#usage-examples)
5. [Best Practices](#best-practices)

---

## Validation System

### Validation Middleware

The API uses `express-validator` for comprehensive input validation. All validation rules are centralized in the middleware layer.

#### Available Validation Modules

1. **`validation.ts`** - Core validation rules for auth, reels, folders, pagination
2. **`searchValidation.ts`** - Search and filter validation rules
3. **`validators.ts`** - Reusable validation utilities and functions

### Auth Validation

#### Registration

```typescript
import {
  registerValidation,
  validationHandler,
} from "./middleware/validation.js";

router.post(
  "/register",
  registerValidation,
  validationHandler,
  asyncHandler(register)
);
```

**Validation Rules:**

- Email: Required, valid email format, max 255 characters
- Password: Required, min 8 characters, max 128 characters, must contain uppercase, lowercase, and number

#### Login

```typescript
import { loginValidation, validationHandler } from "./middleware/validation.js";

router.post("/login", loginValidation, validationHandler, asyncHandler(login));
```

**Validation Rules:**

- Email: Required, valid email format
- Password: Required

### Reel Validation

#### Extract Reel

```typescript
import {
  reelExtractionValidation,
  validationHandler,
} from "./middleware/validation.js";

router.post(
  "/extract",
  reelExtractionValidation,
  validationHandler,
  asyncHandler(extractReel)
);
```

**Validation Rules:**

- instagramUrl: Required, must match Instagram URL pattern

#### Update Reel

```typescript
import {
  reelUpdateValidation,
  objectIdValidation,
  validationHandler,
} from "./middleware/validation.js";

router.patch(
  "/:id",
  objectIdValidation,
  reelUpdateValidation,
  validationHandler,
  asyncHandler(updateReel)
);
```

**Validation Rules:**

- id (param): Required, valid MongoDB ObjectId
- title: Optional, 1-200 characters
- folderId: Optional, valid MongoDB ObjectId
- tags: Optional, array of strings, max 20 tags, each max 50 characters

### Folder Validation

#### Create Folder

```typescript
import {
  folderCreationValidation,
  validationHandler,
} from "./middleware/validation.js";

router.post(
  "/",
  folderCreationValidation,
  validationHandler,
  asyncHandler(createFolder)
);
```

**Validation Rules:**

- name: Required, 1-50 characters
- color: Optional, hex color format (#RRGGBB)

#### Update Folder

```typescript
import {
  folderUpdateValidation,
  objectIdValidation,
  validationHandler,
} from "./middleware/validation.js";

router.patch(
  "/:id",
  objectIdValidation,
  folderUpdateValidation,
  validationHandler,
  asyncHandler(updateFolder)
);
```

**Validation Rules:**

- id (param): Required, valid MongoDB ObjectId
- name: Optional, 1-50 characters
- color: Optional, hex color format (#RRGGBB)

### Search & Filter Validation

#### Search

```typescript
import {
  searchQueryValidation,
  validationHandler,
} from "./middleware/searchValidation.js";

router.get(
  "/search",
  searchQueryValidation,
  validationHandler,
  asyncHandler(search)
);
```

**Validation Rules:**

- q: Required, 2-200 characters
- limit: Optional, 1-100
- skip: Optional, >= 0

#### Filter

```typescript
import {
  filterQueryValidation,
  validationHandler,
} from "./middleware/searchValidation.js";

router.get(
  "/filter",
  filterQueryValidation,
  validationHandler,
  asyncHandler(filter)
);
```

**Validation Rules:**

- At least one filter required (folderId, tags, dateFrom, dateTo)
- folderId: Optional, valid MongoDB ObjectId
- tags: Optional, comma-separated string, max 20 tags
- dateFrom: Optional, ISO date format
- dateTo: Optional, ISO date format, must be after dateFrom
- Date range: Max 5 years

### Pagination Validation

```typescript
import {
  paginationValidation,
  validationHandler,
} from "./middleware/validation.js";

router.get(
  "/list",
  paginationValidation,
  validationHandler,
  asyncHandler(list)
);
```

**Validation Rules:**

- limit: Optional, 1-100
- skip: Optional, >= 0
- page: Optional, >= 1

### ObjectId Validation

```typescript
import {
  objectIdValidation,
  validationHandler,
} from "./middleware/validation.js";

// For :id parameter
router.get(
  "/:id",
  objectIdValidation,
  validationHandler,
  asyncHandler(getById)
);

// For custom parameter names
import { validateObjectId } from "./middleware/validation.js";
router.get(
  "/:reelId",
  validateObjectId("reelId"),
  validationHandler,
  asyncHandler(getReel)
);
```

---

## Error Handling

### Global Error Handler

The global error handler (`errorHandler.ts`) catches all errors and formats them consistently.

#### Features

1. **Automatic Error Type Detection**

   - Mongoose validation errors
   - MongoDB duplicate key errors
   - Mongoose cast errors (invalid ObjectId)
   - JWT errors (expired, invalid)
   - express-validator errors
   - Custom AppError instances

2. **Error Logging**

   - Operational errors logged as warnings
   - Programming errors logged as errors with full stack trace
   - Includes request context (method, URL, user, IP, user-agent)
   - Validation errors logged separately for tracking

3. **Environment-Aware**
   - Development: Full error details including stack traces
   - Production: Sanitized error messages, no sensitive data

### Custom Error Classes

Located in `utils/errors.ts`:

#### Base Errors

```typescript
// Base application error
throw new AppError("Custom error message", "ERROR_CODE", 500);

// Validation error
throw new ValidationError("Validation failed", { email: "Invalid email" });

// Authentication error (401)
throw new AuthenticationError("Invalid credentials");

// Authorization error (403)
throw new AuthorizationError("Access denied");

// Not found error (404)
throw new NotFoundError("Resource not found");

// Conflict error (409)
throw new ConflictError("Resource already exists");

// Database error (500)
throw new DatabaseError("Database operation failed");

// External service error (502)
throw new ExternalServiceError("Service unavailable", "Instagram API");
```

#### Domain-Specific Errors

```typescript
// Instagram errors
throw new InvalidInstagramUrlError();
throw new MediaNotFoundError();
throw new PrivateMediaError();
throw new UnsupportedMediaError();

// Video processing errors
throw new VideoDownloadError();
throw new AudioExtractionError();
throw new ThumbnailGenerationError();

// AI service errors
throw new TranscriptionError();
throw new SummarizationError();
throw new OcrError();

// Reel processing error
throw new ReelProcessingError(
  "Processing failed",
  "thumbnail_generation",
  originalError
);
```

### Async Error Handling

Use `asyncHandler` wrapper for all async route handlers:

```typescript
import { asyncHandler } from "./middleware/errorHandler.js";

router.get(
  "/reels",
  asyncHandler(async (req, res) => {
    // Any errors thrown here will be caught and passed to error handler
    const reels = await Reel.find();
    successResponse(res, 200, reels);
  })
);
```

---

## Response Formats

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Success Response with Pagination

```json
{
  "success": true,
  "data": [ ... ],
  "message": "Reels retrieved successfully",
  "meta": {
    "total": 100,
    "limit": 20,
    "skip": 0,
    "page": 1,
    "totalPages": 5,
    "hasMore": true,
    "hasPrevious": false
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response

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
  ],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/auth/register"
}
```

### Error Response (Development)

```json
{
  "success": false,
  "message": "Database operation failed",
  "code": "DATABASE_ERROR",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/reels/123",
  "stack": "Error: Database operation failed\n    at ..."
}
```

---

## Usage Examples

### Example 1: Create Reel with Validation

```typescript
import {
  reelExtractionValidation,
  validationHandler,
} from "./middleware/validation.js";
import { asyncHandler } from "./middleware/errorHandler.js";
import { createdResponse } from "./utils/response.js";
import { InvalidInstagramUrlError } from "./utils/errors.js";

router.post(
  "/extract",
  reelExtractionValidation,
  validationHandler,
  asyncHandler(async (req, res) => {
    const { instagramUrl } = req.body;

    // Additional business logic validation
    if (await Reel.findOne({ instagramUrl })) {
      throw new ConflictError("Reel already exists");
    }

    const reel = await processReel(instagramUrl);
    createdResponse(res, reel, "Reel extracted successfully");
  })
);
```

### Example 2: Search with Pagination

```typescript
import {
  searchQueryValidation,
  validationHandler,
} from "./middleware/searchValidation.js";
import { asyncHandler } from "./middleware/errorHandler.js";
import { paginatedResponse } from "./utils/response.js";

router.get(
  "/search",
  searchQueryValidation,
  validationHandler,
  asyncHandler(async (req, res) => {
    const { q, limit = 20, skip = 0 } = req.query;

    const reels = await Reel.find({ $text: { $search: q } })
      .limit(limit)
      .skip(skip);

    const total = await Reel.countDocuments({ $text: { $search: q } });

    paginatedResponse(res, 200, reels, total, limit, skip, "Search results");
  })
);
```

### Example 3: Update with Multiple Validations

```typescript
import {
  objectIdValidation,
  reelUpdateValidation,
  validationHandler,
} from "./middleware/validation.js";
import { asyncHandler } from "./middleware/errorHandler.js";
import { successResponse } from "./utils/response.js";
import { NotFoundError, AuthorizationError } from "./utils/errors.js";

router.patch(
  "/:id",
  objectIdValidation,
  reelUpdateValidation,
  validationHandler,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const reel = await Reel.findById(id);

    if (!reel) {
      throw new NotFoundError("Reel not found");
    }

    if (reel.userId.toString() !== userId) {
      throw new AuthorizationError("Not authorized to update this reel");
    }

    Object.assign(reel, req.body);
    await reel.save();

    successResponse(res, 200, reel, "Reel updated successfully");
  })
);
```

### Example 4: Custom Validation Logic

```typescript
import { body, validationResult } from "express-validator";
import { isValidObjectId } from "./utils/validators.js";

const customValidation = [
  body("items")
    .isArray({ min: 1, max: 10 })
    .withMessage("Items must be an array with 1-10 elements"),

  body("items.*.id").custom((value) => {
    if (!isValidObjectId(value)) {
      throw new Error("Invalid item ID");
    }
    return true;
  }),

  body("items.*.quantity")
    .isInt({ min: 1, max: 100 })
    .withMessage("Quantity must be between 1 and 100"),
];

router.post(
  "/batch",
  customValidation,
  validationHandler,
  asyncHandler(handler)
);
```

---

## Best Practices

### 1. Always Use Validation Middleware

```typescript
// ✅ Good
router.post(
  "/reels",
  reelExtractionValidation,
  validationHandler,
  asyncHandler(createReel)
);

// ❌ Bad - No validation
router.post("/reels", asyncHandler(createReel));
```

### 2. Use Async Handler for All Async Routes

```typescript
// ✅ Good
router.get(
  "/reels",
  asyncHandler(async (req, res) => {
    const reels = await Reel.find();
    successResponse(res, 200, reels);
  })
);

// ❌ Bad - Errors won't be caught
router.get("/reels", async (req, res) => {
  const reels = await Reel.find();
  res.json(reels);
});
```

### 3. Use Custom Error Classes

```typescript
// ✅ Good - Specific error with proper status code
if (!user) {
  throw new NotFoundError("User not found");
}

// ❌ Bad - Generic error
if (!user) {
  throw new Error("User not found");
}
```

### 4. Use Response Helpers

```typescript
// ✅ Good - Consistent response format
successResponse(res, 200, data, "Success message");

// ❌ Bad - Inconsistent format
res.json({ data, message: "Success" });
```

### 5. Validate ObjectIds in Route Parameters

```typescript
// ✅ Good
router.get(
  "/:id",
  objectIdValidation,
  validationHandler,
  asyncHandler(getById)
);

// ❌ Bad - No validation, will cause CastError
router.get("/:id", asyncHandler(getById));
```

### 6. Provide Clear Error Messages

```typescript
// ✅ Good - Clear, actionable message
throw new ValidationError("Email is required and must be valid");

// ❌ Bad - Vague message
throw new Error("Invalid input");
```

### 7. Log Errors Appropriately

```typescript
// ✅ Good - Error handler logs automatically
throw new DatabaseError("Failed to save user");

// ❌ Bad - Manual logging inconsistent
console.log("Error:", error);
throw error;
```

### 8. Handle Edge Cases

```typescript
// ✅ Good - Check for edge cases
if (tags && tags.length > 20) {
  throw new ValidationError("Maximum 20 tags allowed");
}

// ❌ Bad - No edge case handling
reel.tags = tags;
```

### 9. Use Pagination for Lists

```typescript
// ✅ Good - Paginated response
const total = await Reel.countDocuments(query);
const reels = await Reel.find(query).limit(limit).skip(skip);
paginatedResponse(res, 200, reels, total, limit, skip);

// ❌ Bad - Return all results
const reels = await Reel.find(query);
res.json(reels);
```

### 10. Sanitize User Input

```typescript
import { sanitizeString } from "./utils/validators.js";

// ✅ Good - Sanitize input
const title = sanitizeString(req.body.title);

// ❌ Bad - Use raw input
const title = req.body.title;
```

---

## Testing Validation

### Test Invalid Input

```bash
# Missing required field
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Response:
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "password",
      "message": "Password is required",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

### Test Invalid Format

```bash
# Invalid email format
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "password": "Test1234"}'

# Response:
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

### Test Invalid ObjectId

```bash
# Invalid MongoDB ObjectId
curl -X GET http://localhost:5000/api/reels/invalid-id

# Response:
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

---

## Summary

The validation and error handling system provides:

✅ **Comprehensive Input Validation** - All inputs validated before processing  
✅ **Consistent Error Responses** - Uniform format across all endpoints  
✅ **Clear Error Messages** - User-friendly, actionable error messages  
✅ **Automatic Error Handling** - Centralized error processing  
✅ **Security** - Input sanitization and validation  
✅ **Debugging Support** - Detailed logging and stack traces in development  
✅ **Type Safety** - Full TypeScript support  
✅ **Reusable Components** - Modular validation rules and utilities

For more information, see:

- [Error Handling Guide](./ERROR_HANDLING_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)
