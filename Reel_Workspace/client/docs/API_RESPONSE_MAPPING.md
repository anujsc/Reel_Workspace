# API Response Mapping Guide

## Folders API Response Structure

### Actual API Response

```json
{
  "success": true,
  "data": {
    "folders": [
      {
        "_id": "694931c003e4d2c89f659bfe",
        "name": "Career Development",
        "color": "#3B82F6",
        "userId": "694918bc7cb8e859e6a6b344",
        "reelCount": 0,
        "isDefault": false,
        "createdAt": "2025-12-22T11:55:44.364Z",
        "updatedAt": "2025-12-22T11:55:44.364Z",
        "__v": 0
      }
    ],
    "total": 4
  },
  "timestamp": "2025-12-22T12:41:35.533Z",
  "message": "Folders retrieved successfully"
}
```

## Mapping Logic

### ❌ BEFORE (Incorrect)

```typescript
const folders = (response.data.data || []).map((folder: any) => ({
  // This tries to map over an OBJECT, not an array!
  // response.data.data = { folders: [...], total: 4 }
}));
```

**Problem:** `response.data.data` is an object with `folders` and `total` properties, not an array!

### ✅ AFTER (Correct)

```typescript
const foldersArray = response.data.data?.folders || response.data.data || [];
const folders = foldersArray.map((folder: any) => ({
  id: folder.id || folder._id,
  name: folder.name,
  color: folder.color,
  reelCount: folder.reelCount || 0,
  isDefault: folder.isDefault || false,
  createdAt: folder.createdAt,
  updatedAt: folder.updatedAt,
}));
```

**Solution:** First extract the `folders` array, then map over it!

## Field Mapping

### Backend → Frontend

```typescript
{
  _id: "694931c003e4d2c89f659bfe"     → id: "694931c003e4d2c89f659bfe"
  name: "Career Development"           → name: "Career Development"
  color: "#3B82F6"                     → color: "#3B82F6"
  reelCount: 0                         → reelCount: 0
  isDefault: false                     → isDefault: false
  createdAt: "2025-12-22T11:55:44.364Z" → createdAt: "2025-12-22T11:55:44.364Z"
  updatedAt: "2025-12-22T11:55:44.364Z" → updatedAt: "2025-12-22T11:55:44.364Z"

  // Ignored fields:
  userId: "..."                        → (not needed in frontend)
  __v: 0                               → (MongoDB version key)
}
```

## Other API Endpoints

### Reels API Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "sourceUrl": "...",
      "title": "..."
      // ... reel fields
    }
  ],
  "meta": {
    "total": 10,
    "limit": 20,
    "skip": 0
  }
}
```

**Mapping:**

```typescript
const reels = response.data.data.map((reel: any) => ({
  id: reel._id,
  url: reel.sourceUrl,
  // ... other fields
}));
```

### Create Folder Response

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "New Folder",
    "color": "#3B82F6"
    // ... other fields
  },
  "message": "Folder created successfully"
}
```

### Update Folder Response

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Updated Name"
    // ... other fields
  },
  "message": "Folder updated successfully"
}
```

### Delete Folder Response

```json
{
  "success": true,
  "message": "Folder deleted successfully"
}
```

## Response Structure Patterns

### Pattern 1: Array in `data.folders`

```json
{
  "data": {
    "folders": [...],
    "total": 4
  }
}
```

**Access:** `response.data.data.folders`

### Pattern 2: Direct array in `data`

```json
{
  "data": [...]
}
```

**Access:** `response.data.data`

### Pattern 3: Single object in `data`

```json
{
  "data": { ... }
}
```

**Access:** `response.data.data`

## Handling Both Patterns

```typescript
// Flexible approach that handles multiple patterns
const foldersArray =
  response.data.data?.folders || // Pattern 1
  response.data.data || // Pattern 2 or 3
  []; // Fallback

// Ensure it's an array
const folders = Array.isArray(foldersArray) ? foldersArray : [foldersArray];
```

## TypeScript Types

### Backend Response Type

```typescript
interface FoldersApiResponse {
  success: boolean;
  data: {
    folders: BackendFolder[];
    total: number;
  };
  timestamp: string;
  message: string;
}

interface BackendFolder {
  _id: string;
  name: string;
  color: string;
  userId: string;
  reelCount: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
```

### Frontend Type

```typescript
interface Folder {
  id: string;
  name: string;
  color: string;
  reelCount: number;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

## Best Practices

1. **Always check the actual API response** in browser DevTools Network tab
2. **Use optional chaining** (`?.`) to safely access nested properties
3. **Provide fallbacks** with `||` operator
4. **Log the response** during development to verify structure
5. **Map backend fields** to match frontend naming conventions
6. **Handle both `id` and `_id`** for MongoDB compatibility
7. **Provide default values** for optional fields

## Testing API Responses

### Using Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Look for `/api/folders` request
5. Click on it
6. View "Response" tab
7. Copy the JSON structure

### Using Console

```javascript
// In browser console
fetch("http://localhost:5000/api/folders", {
  headers: {
    Authorization: "Bearer YOUR_TOKEN",
  },
})
  .then((r) => r.json())
  .then((data) => console.log(JSON.stringify(data, null, 2)));
```
