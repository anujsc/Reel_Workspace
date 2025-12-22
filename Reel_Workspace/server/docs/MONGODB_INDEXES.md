# MongoDB Index Setup Guide

This document provides the complete MongoDB index setup for optimal performance of the Reel Workspace API.

## Why Indexes Matter

Indexes dramatically improve query performance by allowing MongoDB to quickly locate documents without scanning the entire collection. Without proper indexes:

- Queries can take seconds instead of milliseconds
- Database CPU usage increases
- Application response times suffer

## Index Setup

### Option 1: Automatic Setup (Recommended)

Mongoose automatically creates indexes defined in schemas when the application starts. Ensure your models have the following index definitions:

**User Model:**

```typescript
userSchema.index({ email: 1 }, { unique: true });
```

**Folder Model:**

```typescript
folderSchema.index({ userId: 1, name: 1 }, { unique: true });
folderSchema.index({ userId: 1, isDefault: 1 });
```

**Reel Model:**

```typescript
reelSchema.index({ userId: 1, createdAt: -1 });
reelSchema.index({ userId: 1, sourceUrl: 1 }, { unique: true });
reelSchema.index({ userId: 1, folderId: 1 });
reelSchema.index({ userId: 1, tags: 1 });
reelSchema.index({ userId: 1, isDeleted: 1 });

// Text search index
reelSchema.index(
  {
    summary: "text",
    transcript: "text",
    ocrText: "text",
  },
  {
    weights: {
      summary: 10,
      transcript: 5,
      ocrText: 3,
    },
    name: "reel_text_search",
  }
);
```

### Option 2: Manual Setup via MongoDB Shell

Connect to your MongoDB instance and run:

```javascript
// Connect to database
use reelworkspace;

// ============================================
// USER COLLECTION INDEXES
// ============================================

// Unique email index for authentication
db.users.createIndex(
  { email: 1 },
  {
    unique: true,
    name: "email_unique"
  }
);

// ============================================
// FOLDER COLLECTION INDEXES
// ============================================

// Unique folder name per user
db.folders.createIndex(
  { userId: 1, name: 1 },
  {
    unique: true,
    name: "userId_name_unique"
  }
);

// Find default folder for user
db.folders.createIndex(
  { userId: 1, isDefault: 1 },
  { name: "userId_isDefault" }
);

// ============================================
// REEL COLLECTION INDEXES
// ============================================

// List reels by user (sorted by date)
db.reels.createIndex(
  { userId: 1, createdAt: -1 },
  { name: "userId_createdAt" }
);

// Prevent duplicate reel URLs per user
db.reels.createIndex(
  { userId: 1, sourceUrl: 1 },
  {
    unique: true,
    name: "userId_sourceUrl_unique"
  }
);

// Filter reels by folder
db.reels.createIndex(
  { userId: 1, folderId: 1 },
  { name: "userId_folderId" }
);

// Filter reels by tags
db.reels.createIndex(
  { userId: 1, tags: 1 },
  { name: "userId_tags" }
);

// Exclude deleted reels
db.reels.createIndex(
  { userId: 1, isDeleted: 1 },
  { name: "userId_isDeleted" }
);

// Compound index for common queries
db.reels.createIndex(
  { userId: 1, isDeleted: 1, createdAt: -1 },
  { name: "userId_isDeleted_createdAt" }
);

// Text search index (weighted)
db.reels.createIndex(
  {
    summary: "text",
    transcript: "text",
    ocrText: "text"
  },
  {
    weights: {
      summary: 10,
      transcript: 5,
      ocrText: 3
    },
    name: "reel_text_search",
    default_language: "english"
  }
);

print("✅ All indexes created successfully!");
```

### Option 3: Using MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Navigate to each collection
4. Click "Indexes" tab
5. Click "Create Index"
6. Enter index definition (JSON format)
7. Click "Create Index"

**Example for Reel text search:**

```json
{
  "summary": "text",
  "transcript": "text",
  "ocrText": "text"
}
```

**Options:**

```json
{
  "weights": {
    "summary": 10,
    "transcript": 5,
    "ocrText": 3
  },
  "name": "reel_text_search"
}
```

## Verify Indexes

### Check Existing Indexes

```javascript
// List all indexes on reels collection
db.reels.getIndexes();

// List all indexes on folders collection
db.folders.getIndexes();

// List all indexes on users collection
db.users.getIndexes();
```

### Expected Output

**Users Collection:**

```javascript
[
  { v: 2, key: { _id: 1 }, name: "_id_" },
  { v: 2, key: { email: 1 }, name: "email_unique", unique: true },
];
```

**Folders Collection:**

```javascript
[
  { v: 2, key: { _id: 1 }, name: "_id_" },
  {
    v: 2,
    key: { userId: 1, name: 1 },
    name: "userId_name_unique",
    unique: true,
  },
  { v: 2, key: { userId: 1, isDefault: 1 }, name: "userId_isDefault" },
];
```

**Reels Collection:**

```javascript
[
  { v: 2, key: { _id: 1 }, name: "_id_" },
  { v: 2, key: { userId: 1, createdAt: -1 }, name: "userId_createdAt" },
  {
    v: 2,
    key: { userId: 1, sourceUrl: 1 },
    name: "userId_sourceUrl_unique",
    unique: true,
  },
  { v: 2, key: { userId: 1, folderId: 1 }, name: "userId_folderId" },
  { v: 2, key: { userId: 1, tags: 1 }, name: "userId_tags" },
  { v: 2, key: { userId: 1, isDeleted: 1 }, name: "userId_isDeleted" },
  {
    v: 2,
    key: { userId: 1, isDeleted: 1, createdAt: -1 },
    name: "userId_isDeleted_createdAt",
  },
  {
    v: 2,
    key: { _fts: "text", _ftsx: 1 },
    name: "reel_text_search",
    weights: { summary: 10, transcript: 5, ocrText: 3 },
    default_language: "english",
  },
];
```

## Test Index Performance

### Before and After Comparison

**Test Query (without index):**

```javascript
db.reels
  .find({
    userId: ObjectId("..."),
    isDeleted: false,
  })
  .explain("executionStats");
```

**Look for:**

- `executionTimeMillis`: Should be < 100ms with index
- `totalDocsExamined`: Should be close to `nReturned`
- `stage`: Should be "IXSCAN" (index scan) not "COLLSCAN" (collection scan)

### Example Explain Output (Good)

```javascript
{
  "executionStats": {
    "executionSuccess": true,
    "nReturned": 20,
    "executionTimeMillis": 5,
    "totalDocsExamined": 20,
    "executionStages": {
      "stage": "IXSCAN",  // ✅ Using index
      "indexName": "userId_isDeleted_createdAt"
    }
  }
}
```

### Example Explain Output (Bad)

```javascript
{
  "executionStats": {
    "executionSuccess": true,
    "nReturned": 20,
    "executionTimeMillis": 450,
    "totalDocsExamined": 10000,
    "executionStages": {
      "stage": "COLLSCAN"  // ❌ Full collection scan
    }
  }
}
```

## Index Maintenance

### Monitor Index Usage

```javascript
// Get index statistics
db.reels.aggregate([{ $indexStats: {} }]);
```

### Drop Unused Indexes

```javascript
// Drop specific index
db.reels.dropIndex("index_name");

// Drop all indexes except _id
db.reels.dropIndexes();
```

### Rebuild Indexes

```javascript
// Rebuild all indexes (useful after bulk operations)
db.reels.reIndex();
```

## Index Best Practices

### 1. Index Selectivity

✅ **Good:** Index on fields with high cardinality (many unique values)

- `email` (unique per user)
- `sourceUrl` (unique per user)
- `userId` (many users)

❌ **Bad:** Index on fields with low cardinality (few unique values)

- `isDeleted` (only true/false)
- `isDefault` (only true/false)

**Note:** Low cardinality fields are OK in compound indexes

### 2. Compound Index Order

Order matters! Put most selective fields first:

✅ **Good:**

```javascript
{ userId: 1, sourceUrl: 1 }  // userId filters to user's reels, sourceUrl is unique
```

❌ **Bad:**

```javascript
{ sourceUrl: 1, userId: 1 }  // sourceUrl alone doesn't help much
```

### 3. Index Size

Monitor index size:

```javascript
db.reels.stats().indexSizes;
```

**Guidelines:**

- Total index size should be < 50% of collection size
- If indexes are too large, consider:
  - Removing unused indexes
  - Using partial indexes
  - Archiving old data

### 4. Text Index Limitations

- Only one text index per collection
- Text indexes are large (can be 2-3x document size)
- Consider using Atlas Search for advanced text search

### 5. Write Performance

Indexes slow down writes (inserts, updates, deletes):

- Each index must be updated on write
- Balance read performance vs write performance
- For write-heavy collections, minimize indexes

## Production Recommendations

### 1. MongoDB Atlas

If using Atlas, enable:

- **Performance Advisor**: Suggests missing indexes
- **Index Suggestions**: Auto-generated based on query patterns
- **Slow Query Logs**: Identifies queries needing indexes

### 2. Monitoring

Set up alerts for:

- Slow queries (> 100ms)
- Collection scans (COLLSCAN)
- High index size growth

### 3. Regular Audits

Monthly:

- Review index usage statistics
- Remove unused indexes
- Add indexes for new query patterns
- Check index size vs collection size

### 4. Backup Strategy

Before major index changes:

```bash
# Backup database
mongodump --uri="mongodb://..." --out=/backup/

# Test index changes on staging
# Verify performance improvements
# Apply to production
```

## Troubleshooting

### Issue: Index Creation Fails

**Error:** `Index already exists with different options`

**Solution:**

```javascript
// Drop existing index
db.reels.dropIndex("index_name");

// Recreate with correct options
db.reels.createIndex(...);
```

### Issue: Queries Still Slow

**Possible Causes:**

1. Index not being used (check with explain())
2. Index doesn't match query pattern
3. Collection too large (consider sharding)
4. Insufficient RAM (indexes should fit in RAM)

**Solution:**

```javascript
// Force index usage
db.reels.find({...}).hint("index_name");

// Check if index fits in RAM
db.reels.stats().indexSizes;
```

### Issue: Text Search Returns No Results

**Possible Causes:**

1. Text index not created
2. Search query too specific
3. Language mismatch

**Solution:**

```javascript
// Verify text index exists
db.reels.getIndexes().filter((idx) => idx.key._fts === "text");

// Test simple search
db.reels.find({ $text: { $search: "test" } });
```

## Index Size Estimates

For 1000 reels:

| Index            | Estimated Size | Purpose          |
| ---------------- | -------------- | ---------------- |
| \_id             | ~50KB          | Default          |
| userId_createdAt | ~100KB         | List reels       |
| userId_sourceUrl | ~150KB         | Duplicate check  |
| userId_folderId  | ~100KB         | Filter by folder |
| userId_tags      | ~120KB         | Filter by tags   |
| text_search      | ~2-3MB         | Full-text search |
| **Total**        | **~3.5MB**     | All indexes      |

**Note:** Text indexes are significantly larger than other indexes.

## Summary

✅ **Required Indexes:**

- User: email (unique)
- Folder: userId + name (unique)
- Reel: userId + sourceUrl (unique)
- Reel: userId + createdAt (list queries)
- Reel: text search (search functionality)

✅ **Optional but Recommended:**

- Reel: userId + folderId (filter by folder)
- Reel: userId + tags (filter by tags)
- Reel: userId + isDeleted (exclude deleted)

✅ **Maintenance:**

- Monitor index usage monthly
- Remove unused indexes
- Rebuild indexes after bulk operations
- Keep total index size < 50% of collection size

---

**Last Updated:** December 2024
