# Reel Workspace API Documentation

## Overview

The Reel Workspace API is a comprehensive backend service for managing AI-powered Instagram Reel knowledge extraction and organization. The API provides endpoints for user authentication, reel extraction with AI processing, folder management, and advanced search/filtering capabilities.

**Base URL (Local Development):** `http://localhost:5000`

**Authentication:** JWT Bearer Token

**Response Format:** All responses follow a consistent JSON structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": { ... } // Only for paginated endpoints
}
```

**Error Response Format:**

```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] // Validation errors if applicable
}
```

## Authentication

All endpoints except `/api/auth/register` and `/api/auth/login` require authentication using a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Register

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Access:** Public

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Validation Rules:**

- Email: Must be valid email format
- Password: Minimum 6 characters

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

- `400 Bad Request`: Validation errors (invalid email, weak password)
- `409 Conflict`: Email already exists

---

### Login

Authenticate and receive JWT token.

**Endpoint:** `POST /api/auth/login`

**Access:** Public

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

- `400 Bad Request`: Missing or invalid fields
- `401 Unauthorized`: Invalid email or password

---

### Get Current User

Retrieve authenticated user information.

**Endpoint:** `GET /api/auth/me`

**Access:** Private (requires authentication)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid token

---

## Reels

### Extract Reel

Extract and process an Instagram reel with AI-powered analysis.

**Endpoint:** `POST /api/reel/extract`

**Access:** Private

**Request Body:**

```json
{
  "instagramUrl": "https://www.instagram.com/reel/C_example123/"
}
```

**Processing Pipeline:**

1. Fetch reel metadata from Instagram
2. Download video using yt-dlp or Cobalt API
3. Extract audio from video (FFmpeg)
4. Generate transcript using Gemini AI
5. Generate comprehensive summary using Groq AI
6. Extract text from video frames using OCR (Groq Vision)
7. Upload video and thumbnail to Cloudinary
8. Auto-categorize and suggest folder
9. Generate tags and learning materials
10. Save to database

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Reel extracted successfully",
  "data": {
    "reel": {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "folderId": "507f1f77bcf86cd799439013",
      "sourceUrl": "https://www.instagram.com/reel/C_example123/",
      "videoUrl": "https://res.cloudinary.com/...",
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "title": "JavaScript Tips and Tricks",
      "transcript": "Full audio transcript...",
      "summary": "Concise summary of the reel content...",
      "detailedExplanation": "In-depth explanation...",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "examples": ["Example 1", "Example 2"],
      "relatedTopics": ["React", "Node.js"],
      "actionableChecklist": ["Step 1", "Step 2"],
      "quizQuestions": [
        {
          "question": "What is...?",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "A"
        }
      ],
      "quickReferenceCard": "Quick reference summary...",
      "learningPath": ["Beginner", "Intermediate", "Advanced"],
      "commonPitfalls": ["Pitfall 1", "Pitfall 2"],
      "glossary": [
        {
          "term": "API",
          "definition": "Application Programming Interface"
        }
      ],
      "interactivePromptSuggestions": ["Prompt 1", "Prompt 2"],
      "tags": ["javascript", "tutorial", "webdev"],
      "ocrText": "Text extracted from video frames...",
      "durationSeconds": 45,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "timings": {
      "fetch": 1200,
      "download": 3500,
      "audio": 800,
      "transcript": 4200,
      "summary": 2100,
      "ocr": 1500,
      "upload": 2800,
      "total": 16100
    }
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid URL format
- `409 Conflict`: Reel already extracted
- `500 Internal Server Error`: Processing failure (scraper, AI, upload)

---

### Get All Reels

Retrieve all reels for authenticated user with pagination.

**Endpoint:** `GET /api/reel`

**Access:** Private

**Query Parameters:**

- `limit` (optional): Results per page (default: 20, max: 100)
- `skip` (optional): Number of results to skip (default: 0)
- `folderId` (optional): Filter by folder ID

**Example Request:**

```
GET /api/reel?limit=10&skip=0&folderId=507f1f77bcf86cd799439013
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Reels retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "JavaScript Tips",
      "summary": "Quick summary...",
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "tags": ["javascript", "tutorial"],
      "folderId": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Programming",
        "color": "#3B82F6"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 10,
    "skip": 0,
    "hasMore": true
  }
}
```

---

### Get Reel By ID

Retrieve a single reel with complete details.

**Endpoint:** `GET /api/reel/:id`

**Access:** Private

**URL Parameters:**

- `id`: MongoDB ObjectId of the reel

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Reel retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "JavaScript Tips",
    "summary": "Complete summary...",
    "transcript": "Full transcript...",
    "videoUrl": "https://res.cloudinary.com/...",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "tags": ["javascript", "tutorial"],
    "folderId": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Programming",
      "color": "#3B82F6"
    },
    "detailedExplanation": "...",
    "keyPoints": ["..."],
    "examples": ["..."],
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid ID format
- `404 Not Found`: Reel not found

---

### Update Reel

Update reel title, tags, or folder.

**Endpoint:** `PATCH /api/reel/:id`

**Access:** Private

**URL Parameters:**

- `id`: MongoDB ObjectId of the reel

**Request Body (all fields optional):**

```json
{
  "title": "Updated Title",
  "tags": ["newtag", "updated"],
  "folderId": "507f1f77bcf86cd799439014"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Reel updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Updated Title",
    "tags": ["newtag", "updated"],
    "folderId": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "New Folder",
      "color": "#FF5733"
    }
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid ID or data format
- `404 Not Found`: Reel or target folder not found

---

### Delete Reel

Soft delete a reel (marks as deleted, doesn't remove from database).

**Endpoint:** `DELETE /api/reel/:id`

**Access:** Private

**URL Parameters:**

- `id`: MongoDB ObjectId of the reel

**Success Response (204 No Content)**

**Error Responses:**

- `400 Bad Request`: Invalid ID format
- `404 Not Found`: Reel not found or already deleted

---

## Folders

### Create Folder

Create a new folder for organizing reels.

**Endpoint:** `POST /api/folders`

**Access:** Private

**Request Body:**

```json
{
  "name": "My Folder",
  "color": "#FF5733"
}
```

**Validation Rules:**

- Name: Required, 1-50 characters, unique per user
- Color: Optional, hex color code (default: #3B82F6)

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Folder created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439012",
    "name": "My Folder",
    "color": "#FF5733",
    "reelCount": 0,
    "isDefault": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Validation errors
- `409 Conflict`: Folder name already exists

---

### Get All Folders

Retrieve all folders for authenticated user.

**Endpoint:** `GET /api/folders`

**Access:** Private

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Folders retrieved successfully",
  "data": {
    "folders": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Programming",
        "color": "#3B82F6",
        "reelCount": 15,
        "isDefault": false
      },
      {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Design",
        "color": "#10B981",
        "reelCount": 8,
        "isDefault": false
      }
    ],
    "total": 2
  }
}
```

---

### Get Folder By ID

Retrieve a single folder.

**Endpoint:** `GET /api/folders/:id`

**Access:** Private

**URL Parameters:**

- `id`: MongoDB ObjectId of the folder

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Folder retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Programming",
    "color": "#3B82F6",
    "reelCount": 15,
    "isDefault": false
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid ID format
- `404 Not Found`: Folder not found

---

### Update Folder

Update folder name or color.

**Endpoint:** `PATCH /api/folders/:id`

**Access:** Private

**URL Parameters:**

- `id`: MongoDB ObjectId of the folder

**Request Body (all fields optional):**

```json
{
  "name": "Updated Name",
  "color": "#00FF00"
}
```

**Note:** Cannot rename default folders.

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Folder updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Updated Name",
    "color": "#00FF00",
    "reelCount": 15
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid ID or data format
- `403 Forbidden`: Attempting to rename default folder
- `404 Not Found`: Folder not found
- `409 Conflict`: Folder name already exists

---

### Delete Folder

Delete a folder.

**Endpoint:** `DELETE /api/folders/:id`

**Access:** Private

**URL Parameters:**

- `id`: MongoDB ObjectId of the folder

**Query Parameters:**

- `strategy` (optional): Deletion strategy
  - `prevent` (default): Prevent deletion if folder contains reels
  - `move`: Move reels to "Uncategorized" folder before deletion

**Example Request:**

```
DELETE /api/folders/507f1f77bcf86cd799439013?strategy=move
```

**Note:** Cannot delete default folders.

**Success Response (204 No Content)**

**Error Responses:**

- `400 Bad Request`: Invalid ID format
- `403 Forbidden`: Attempting to delete default folder
- `404 Not Found`: Folder not found
- `409 Conflict`: Folder contains reels (when strategy=prevent)

---

## Search & Filter

### Search Reels

Full-text search across reel summaries, transcripts, and OCR text.

**Endpoint:** `GET /api/search`

**Access:** Private

**Query Parameters:**

- `q` (required): Search query (minimum 2 characters)
- `limit` (optional): Results per page (default: 20, max: 100)
- `skip` (optional): Number of results to skip (default: 0)

**Example Request:**

```
GET /api/search?q=javascript&limit=10&skip=0
```

**Search Behavior:**

- Uses MongoDB text index for relevance scoring
- Searches across: summary, transcript, ocrText fields
- Results sorted by relevance score (descending)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Search completed successfully",
  "data": {
    "results": [
      {
        "id": "507f1f77bcf86cd799439011",
        "title": "JavaScript Tips",
        "summary": "Quick summary...",
        "thumbnailUrl": "https://res.cloudinary.com/...",
        "tags": ["javascript", "tutorial"],
        "folderId": {
          "id": "507f1f77bcf86cd799439013",
          "name": "Programming",
          "color": "#3B82F6"
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "score": 2.5
      }
    ],
    "pagination": {
      "total": 15,
      "limit": 10,
      "skip": 0,
      "hasMore": true
    },
    "query": "javascript"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Missing or invalid query parameter

---

### Filter Reels

Advanced filtering by folder, tags, and date range.

**Endpoint:** `GET /api/reel/filter`

**Access:** Private

**Query Parameters (all optional):**

- `folderId`: Filter by folder ID
- `tags`: Comma-separated tags (e.g., "javascript,react,tutorial")
- `dateFrom`: Start date in ISO format (e.g., "2024-01-01")
- `dateTo`: End date in ISO format (e.g., "2024-12-31")
- `limit`: Results per page (default: 20, max: 100)
- `skip`: Number of results to skip (default: 0)

**Example Request:**

```
GET /api/reel/filter?folderId=507f1f77bcf86cd799439013&tags=javascript,react&dateFrom=2024-01-01&dateTo=2024-12-31&limit=10
```

**Filter Behavior:**

- All filters are combined with AND logic
- Tags filter uses OR logic (matches any of the provided tags)
- Date range is inclusive

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Filter applied successfully",
  "data": {
    "results": [
      {
        "id": "507f1f77bcf86cd799439011",
        "title": "JavaScript Tips",
        "summary": "Quick summary...",
        "thumbnailUrl": "https://res.cloudinary.com/...",
        "tags": ["javascript", "react"],
        "folderId": {
          "id": "507f1f77bcf86cd799439013",
          "name": "Programming",
          "color": "#3B82F6"
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "durationSeconds": 45
      }
    ],
    "pagination": {
      "total": 8,
      "limit": 10,
      "skip": 0,
      "hasMore": false
    },
    "filters": {
      "folderId": "507f1f77bcf86cd799439013",
      "tags": ["javascript", "react"],
      "dateFrom": "2024-01-01",
      "dateTo": "2024-12-31"
    },
    "counts": {
      "total": 45,
      "filtered": 8
    }
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid folder ID or date format

---

### Get Filter Statistics

Get statistics for building filter UI (available tags, date range, folder counts).

**Endpoint:** `GET /api/reel/filter/stats`

**Access:** Private

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Filter statistics retrieved successfully",
  "data": {
    "tags": [
      {
        "tag": "javascript",
        "count": 25
      },
      {
        "tag": "react",
        "count": 18
      },
      {
        "tag": "tutorial",
        "count": 15
      }
    ],
    "dateRange": {
      "oldest": "2024-01-01T00:00:00.000Z",
      "newest": "2024-12-31T23:59:59.999Z"
    },
    "folders": [
      {
        "folderId": "507f1f77bcf86cd799439013",
        "folderName": "Programming",
        "folderColor": "#3B82F6",
        "count": 30
      },
      {
        "folderId": "507f1f77bcf86cd799439014",
        "folderName": "Design",
        "folderColor": "#10B981",
        "count": 15
      }
    ]
  }
}
```

---

## Pagination

All list endpoints support pagination using `limit` and `skip` query parameters:

- `limit`: Number of results per page (default: 20, max: 100)
- `skip`: Number of results to skip (default: 0)

**Pagination Metadata:**

```json
{
  "pagination": {
    "total": 100,
    "limit": 20,
    "skip": 0,
    "hasMore": true
  }
}
```

**Calculating Pages:**

- Current page: `Math.floor(skip / limit) + 1`
- Total pages: `Math.ceil(total / limit)`
- Next page skip: `skip + limit`
- Previous page skip: `Math.max(0, skip - limit)`

---

## Rate Limits

Currently, no hard rate limits are enforced. However, consider the following:

- **Reel Extraction**: Resource-intensive operation (video download, AI processing)
  - Recommended: Max 5 concurrent extractions per user
  - Average processing time: 10-20 seconds per reel
- **Search/Filter**: Optimized with database indexes
  - No practical limits for normal usage

---

## Error Codes

| Status Code | Description                                                       |
| ----------- | ----------------------------------------------------------------- |
| 200         | OK - Request successful                                           |
| 201         | Created - Resource created successfully                           |
| 204         | No Content - Request successful, no response body                 |
| 400         | Bad Request - Validation error or invalid input                   |
| 401         | Unauthorized - Missing or invalid authentication token            |
| 403         | Forbidden - Authenticated but not authorized for action           |
| 404         | Not Found - Resource not found                                    |
| 409         | Conflict - Resource already exists or conflict with current state |
| 500         | Internal Server Error - Server-side error                         |

---

## cURL Examples

### Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

### Extract Reel

```bash
curl -X POST http://localhost:5000/api/reel/extract \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "instagramUrl": "https://www.instagram.com/reel/C_example123/"
  }'
```

### Get All Reels

```bash
curl -X GET "http://localhost:5000/api/reel?limit=10&skip=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Search Reels

```bash
curl -X GET "http://localhost:5000/api/search?q=javascript&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Folder

```bash
curl -X POST http://localhost:5000/api/folders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "My Folder",
    "color": "#FF5733"
  }'
```

### Filter Reels

```bash
curl -X GET "http://localhost:5000/api/reel/filter?tags=javascript,react&dateFrom=2024-01-01" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Environment Variables

The API requires the following environment variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/reelworkspace

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Cloudinary (Media Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI Services
GEMINI_API_KEY_TRANSCRIPT=your-gemini-key
GEMINI_TRANSCRIPTION_MODEL=gemini-2.0-flash-exp
GROQ_API_KEY=your-groq-key
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct

# Video Download
COBALT_API_URL=https://api.cobalt.tools
USE_YTDLP=true
```

---

## Additional Resources

- **Postman Collection**: `/docs/postman/ReelWorkspace.postman_collection.json`
- **Server README**: `/server/README.md`
- **Validation Guide**: `/docs/VALIDATION_GUIDE.md`
- **User Flow Guide**: `/docs/USER_FLOW_API_GUIDE.md`

---

## Support & Troubleshooting

### Common Issues

**1. Authentication Errors (401)**

- Ensure JWT token is included in Authorization header
- Check token format: `Bearer <token>`
- Verify token hasn't expired (default: 7 days)

**2. Reel Extraction Failures**

- Verify Instagram URL is valid and accessible
- Check that all AI service API keys are configured
- Ensure FFmpeg is installed for audio extraction
- Check Cloudinary credentials for media upload

**3. Search Returns No Results**

- Verify text index exists on Reel collection
- Check search query is at least 2 characters
- Ensure reels have been extracted with content

**4. Validation Errors (400)**

- Review request body structure matches documentation
- Check required fields are present
- Verify data types match expected formats

### Health Check

Use the health endpoint to verify API status:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": 1705315800000,
  "environment": "development"
}
```

---

## Version History

**v1.0.0** (Current)

- Initial release
- Complete authentication system
- Reel extraction with AI processing
- Folder management
- Search and filter capabilities
- Comprehensive validation and error handling
