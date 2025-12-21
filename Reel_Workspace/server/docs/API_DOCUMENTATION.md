# Reel Workspace API Documentation

Complete API documentation for Reel CRUD and Folder Management operations.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All endpoints (except auth) require JWT authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 📁 Folder Management API

### Create Folder

Create a new folder for organizing reels.

**Endpoint:** `POST /folders`

**Request Body:**

```json
{
  "name": "Technology",
  "color": "#3B82F6"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Folder created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Technology",
    "color": "#3B82F6",
    "userId": "507f191e810c19729de860ea",
    "reelCount": 0,
    "isDefault": false,
    "createdAt": "2024-12-21T10:00:00.000Z",
    "updatedAt": "2024-12-21T10:00:00.000Z"
  }
}
```

**Validation:**

- `name`: Required, 1-50 characters
- `color`: Optional, must be valid hex color (e.g., #3B82F6)
- Folder names must be unique per user

---

### Get All Folders

Retrieve all folders for the authenticated user.

**Endpoint:** `GET /folders`

**Response (200):**

```json
{
  "success": true,
  "message": "Folders retrieved successfully",
  "data": {
    "folders": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Technology",
        "color": "#3B82F6",
        "userId": "507f191e810c19729de860ea",
        "reelCount": 5,
        "isDefault": false,
        "createdAt": "2024-12-21T10:00:00.000Z",
        "updatedAt": "2024-12-21T10:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

---

### Get Folder by ID

Retrieve a specific folder by ID.

**Endpoint:** `GET /folders/:id`

**Response (200):**

```json
{
  "success": true,
  "message": "Folder retrieved successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Technology",
    "color": "#3B82F6",
    "reelCount": 5
  }
}
```

---

### Update Folder

Update folder name or color.

**Endpoint:** `PATCH /folders/:id`

**Request Body:**

```json
{
  "name": "Tech & Innovation",
  "color": "#10B981"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Folder updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Tech & Innovation",
    "color": "#10B981",
    "reelCount": 5
  }
}
```

**Validation:**

- At least one field (name or color) must be provided
- New name must not conflict with existing folders
- Cannot rename default folders

---

### Delete Folder

Delete a folder. Handles reels based on strategy.

**Endpoint:** `DELETE /folders/:id?strategy=move`

**Query Parameters:**

- `strategy`: Optional, `move` or `prevent` (default: prevent)
  - `prevent`: Fails if folder contains reels
  - `move`: Moves reels to "Uncategorized" folder

**Response (204):** No content

**Error (409) - Folder contains reels:**

```json
{
  "success": false,
  "message": "Cannot delete folder containing 5 reel(s). Move or delete reels first, or use ?strategy=move to auto-move them.",
  "data": {
    "reelCount": 5
  }
}
```

**Rules:**

- Cannot delete default folders
- Empty folders can be deleted directly
- Folders with reels require strategy parameter

---

## 🎬 Reel CRUD API

### Extract Reel

Extract and process an Instagram reel.

**Endpoint:** `POST /reel/extract`

**Request Body:**

```json
{
  "instagramUrl": "https://www.instagram.com/reel/DSVFidFDfFo/"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Reel extracted successfully",
  "data": {
    "reel": {
      "id": "507f1f77bcf86cd799439012",
      "userId": "507f191e810c19729de860ea",
      "folderId": "507f1f77bcf86cd799439011",
      "sourceUrl": "https://www.instagram.com/reel/DSVFidFDfFo/",
      "videoUrl": "https://instagram.fpnq6-1.fna.fbcdn.net/...",
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "title": "Amazing Tech Tutorial",
      "transcript": "Full transcript text...",
      "summary": "Brief 2-3 sentence summary...",
      "detailedExplanation": "Comprehensive 4-6 paragraph explanation...",
      "keyPoints": [
        "First main point explained clearly",
        "Second main point with context"
      ],
      "examples": ["Real-world example 1", "Practical example 2"],
      "relatedTopics": ["Related topic 1", "Related topic 2"],
      "actionableChecklist": [
        "Step 1: Clear actionable first step",
        "Step 2: Specific second action"
      ],
      "quizQuestions": [
        {
          "question": "What is the main concept?",
          "options": ["Option A", "Option B", "Option C"],
          "answer": "Option A with explanation"
        }
      ],
      "quickReferenceCard": {
        "facts": ["Important fact 1", "Key statistic"],
        "definitions": ["Term 1: Definition", "Term 2: Definition"],
        "formulas": ["Formula 1 if applicable"]
      },
      "learningPath": [
        "Beginner: First topic",
        "Intermediate: Next level",
        "Advanced: Deep dive"
      ],
      "commonPitfalls": [
        {
          "pitfall": "Common mistake 1",
          "solution": "How to avoid this mistake"
        }
      ],
      "glossary": [
        {
          "term": "Technical term 1",
          "definition": "Simple clear definition"
        }
      ],
      "interactivePromptSuggestions": [
        "Prompt 1: Question to ask AI",
        "Prompt 2: Another useful prompt"
      ],
      "tags": ["technology", "ai", "learning"],
      "ocrText": "Extracted text from video frames",
      "durationSeconds": 17.74,
      "isDeleted": false,
      "createdAt": "2024-12-21T10:00:00.000Z",
      "updatedAt": "2024-12-21T10:00:00.000Z"
    },
    "timings": {
      "fetchMs": 8597,
      "downloadMs": 5778,
      "audioExtractMs": 3421,
      "thumbnailMs": 2156,
      "transcriptionMs": 12345,
      "summarizationMs": 8765,
      "ocrMs": 1234,
      "totalMs": 42296
    }
  }
}
```

**Validation:**

- `instagramUrl`: Required, must be valid Instagram post/reel URL
- Duplicate URLs are rejected with 409 error

**Processing Steps:**

1. Fetch Instagram media metadata
2. Download video file
3. Extract audio to MP3
4. Generate and upload thumbnail
5. Transcribe audio with Gemini AI
6. Generate comprehensive summary with Groq AI
7. Extract OCR text from thumbnail
8. Create reel document with all data
9. Auto-assign to folder based on content

---

### Get All Reels

Retrieve all reels with pagination and filtering.

**Endpoint:** `GET /reel?limit=20&skip=0&folderId=xxx`

**Query Parameters:**

- `limit`: Optional, 1-100 (default: 20)
- `skip`: Optional, ≥0 (default: 0)
- `folderId`: Optional, filter by folder ID

**Response (200):**

```json
{
  "success": true,
  "message": "Reels retrieved successfully",
  "data": {
    "reels": [
      {
        "id": "507f1f77bcf86cd799439012",
        "title": "Amazing Tech Tutorial",
        "thumbnailUrl": "https://res.cloudinary.com/...",
        "summary": "Brief summary...",
        "tags": ["technology", "ai"],
        "folderId": {
          "name": "Technology",
          "color": "#3B82F6"
        },
        "durationSeconds": 17.74,
        "createdAt": "2024-12-21T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 20,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

---

### Get Single Reel

Retrieve complete reel data by ID.

**Endpoint:** `GET /reel/:id`

**Response (200):**

```json
{
  "success": true,
  "message": "Reel retrieved successfully",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "title": "Amazing Tech Tutorial",
    "transcript": "Full transcript...",
    "summary": "Brief summary...",
    "detailedExplanation": "Comprehensive explanation...",
    "keyPoints": ["Point 1", "Point 2"],
    "examples": ["Example 1", "Example 2"],
    "actionableChecklist": ["Step 1", "Step 2"],
    "quizQuestions": [...],
    "quickReferenceCard": {...},
    "learningPath": [...],
    "commonPitfalls": [...],
    "glossary": [...],
    "interactivePromptSuggestions": [...],
    "tags": ["technology", "ai"],
    "folderId": {
      "name": "Technology",
      "color": "#3B82F6"
    }
  }
}
```

**Validation:**

- Reel must belong to authenticated user
- Returns 404 if not found or unauthorized

---

### Update Reel

Update reel title, folder, or tags.

**Endpoint:** `PATCH /reel/:id`

**Request Body:**

```json
{
  "title": "Updated Title",
  "folderId": "507f1f77bcf86cd799439011",
  "tags": ["updated", "technology", "ai"]
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Reel updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "title": "Updated Title",
    "folderId": {
      "name": "Technology",
      "color": "#3B82F6"
    },
    "tags": ["updated", "technology", "ai"]
  }
}
```

**Validation:**

- At least one field must be provided
- `title`: 1-200 characters
- `folderId`: Must be valid ObjectId and belong to user
- `tags`: Array of strings, max 20 tags
- Folder counts are automatically updated when moving reels

---

### Delete Reel

Soft delete a reel.

**Endpoint:** `DELETE /reel/:id`

**Response (204):** No content

**Features:**

- Soft delete (sets `isDeleted: true`)
- Automatically decrements folder reel count
- Reel must belong to authenticated user

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid Instagram URL format. Must be a valid Instagram post/reel URL"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Cannot delete default folder"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Reel not found"
}
```

### 409 Conflict

```json
{
  "success": false,
  "message": "This reel has already been extracted",
  "data": {
    "id": "507f1f77bcf86cd799439012"
  }
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to extract reel",
  "data": {
    "step": "transcription",
    "details": "API quota exceeded"
  }
}
```

---

## Data Models

### Reel Model

```typescript
interface Reel {
  id: string;
  userId: string;
  folderId: string;
  sourceUrl: string;
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  transcript: string;
  summary: string;
  detailedExplanation: string;
  keyPoints: string[];
  examples: string[];
  relatedTopics: string[];
  actionableChecklist: string[];
  quizQuestions: QuizQuestion[];
  quickReferenceCard: QuickReferenceCard;
  learningPath: string[];
  commonPitfalls: CommonPitfall[];
  glossary: GlossaryTerm[];
  interactivePromptSuggestions: string[];
  tags: string[];
  ocrText: string;
  durationSeconds?: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface QuickReferenceCard {
  facts: string[];
  definitions: string[];
  formulas: string[];
}

interface CommonPitfall {
  pitfall: string;
  solution: string;
}

interface GlossaryTerm {
  term: string;
  definition: string;
}
```

### Folder Model

```typescript
interface Folder {
  id: string;
  name: string;
  color: string;
  userId: string;
  reelCount: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Testing Checklist

### Folder Management

- ✅ Create folder with valid data
- ✅ Create duplicate folder (should fail)
- ✅ Get all folders
- ✅ Get folder by ID
- ✅ Update folder name and color
- ✅ Delete empty folder
- ✅ Delete folder with reels (prevent strategy)
- ✅ Delete folder with reels (move strategy)
- ✅ Prevent default folder deletion

### Reel CRUD

- ✅ Extract reel from Instagram URL
- ✅ Extract duplicate URL (should fail)
- ✅ Get all reels with default pagination
- ✅ Get all reels with custom pagination
- ✅ Get reels filtered by folder
- ✅ Get single reel by ID
- ✅ Update reel title
- ✅ Update reel folder (verify counts)
- ✅ Update reel tags
- ✅ Update multiple fields
- ✅ Delete reel (verify folder count)
- ✅ Access other user's reel (should fail)

### Validation

- ✅ Invalid Instagram URL
- ✅ Missing required fields
- ✅ Invalid hex color
- ✅ Empty title
- ✅ Invalid pagination parameters
- ✅ Invalid ObjectId format
- ✅ Unauthorized access

---

## Rate Limits & Quotas

### AI Services

- **Gemini (Transcription):** Free tier limits apply
- **Groq (Summarization & OCR):** Free tier with generous limits

### Processing Time

- Average reel processing: 30-60 seconds
- Depends on video length and API response times

---

## Best Practices

1. **Always check for duplicates** before extracting reels
2. **Use pagination** for large reel collections
3. **Filter by folder** for better organization
4. **Handle errors gracefully** - processing can fail at various steps
5. **Monitor folder counts** - they update automatically
6. **Use soft delete** - reels can be recovered if needed
7. **Validate input** - all endpoints have strict validation
8. **Cache tokens** - avoid repeated authentication

---

## Support

For issues or questions:

- Check error messages for specific details
- Review validation requirements
- Ensure API keys are configured correctly
- Monitor server logs for processing errors
