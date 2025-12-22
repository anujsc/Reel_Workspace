# Performance Testing Guide

This document outlines performance testing procedures and optimization recommendations for the Reel Workspace API.

## Overview

The Reel Workspace API is designed to handle AI-powered video processing, which is inherently resource-intensive. This guide helps you:

- Test performance under load
- Identify bottlenecks
- Optimize database queries
- Monitor resource usage

## 1. Reel Extraction Performance

### Expected Performance

**Average Processing Time:** 10-20 seconds per reel

**Breakdown:**

- Fetch metadata: ~1s
- Download video: ~3-5s (depends on video size and network)
- Extract audio: ~1s
- AI transcription (Gemini): ~4-6s
- AI summarization (Groq): ~2-3s
- OCR processing (Groq Vision): ~1-2s
- Upload to Cloudinary: ~2-4s

### Load Testing

#### Using Postman Runner

1. Open Postman collection
2. Select "Extract Reel - Success" request
3. Click "Run" → "Run Collection"
4. Configure:
   - Iterations: 5-10
   - Delay: 2000ms (to avoid rate limits)
5. Monitor response times and success rate

#### Using Artillery (Recommended)

Install Artillery:

```bash
npm install -g artillery
```

Create `artillery-config.yml`:

```yaml
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 2
      name: "Warm up"
    - duration: 120
      arrivalRate: 5
      name: "Sustained load"
  variables:
    authToken: "YOUR_JWT_TOKEN_HERE"

scenarios:
  - name: "Extract Reel"
    flow:
      - post:
          url: "/api/reel/extract"
          headers:
            Authorization: "Bearer {{ authToken }}"
            Content-Type: "application/json"
          json:
            instagramUrl: "https://www.instagram.com/reel/EXAMPLE/"
```

Run test:

```bash
artillery run artillery-config.yml
```

### Concurrent Extraction Limits

**Recommended:** Max 5 concurrent extractions per user

**Why?**

- AI API rate limits (Gemini, Groq)
- Memory usage for video processing
- Cloudinary upload bandwidth

**Implementation:**
Consider adding a queue system (Bull, BullMQ) for production:

```typescript
// Example with Bull
import Queue from "bull";

const reelQueue = new Queue("reel-extraction", {
  redis: { host: "localhost", port: 6379 },
});

reelQueue.process(5, async (job) => {
  return await processReel(job.data.instagramUrl);
});
```

## 2. Database Query Performance

### MongoDB Indexes

The following indexes should be created for optimal performance:

```javascript
// Reel collection
db.reels.createIndex({ userId: 1, createdAt: -1 });
db.reels.createIndex({ userId: 1, sourceUrl: 1 }, { unique: true });
db.reels.createIndex({ userId: 1, folderId: 1 });
db.reels.createIndex({ userId: 1, tags: 1 });
db.reels.createIndex({ userId: 1, isDeleted: 1 });

// Text search index
db.reels.createIndex(
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
  }
);

// Folder collection
db.folders.createIndex({ userId: 1, name: 1 }, { unique: true });
db.folders.createIndex({ userId: 1, isDefault: 1 });

// User collection
db.users.createIndex({ email: 1 }, { unique: true });
```

### Query Performance Testing

Use MongoDB's `explain()` to analyze query performance:

```javascript
// Test search query
db.reels
  .find({
    userId: ObjectId("..."),
    isDeleted: false,
    $text: { $search: "javascript" },
  })
  .explain("executionStats");

// Test filter query
db.reels
  .find({
    userId: ObjectId("..."),
    isDeleted: false,
    folderId: ObjectId("..."),
    tags: { $in: ["javascript", "react"] },
    createdAt: { $gte: ISODate("2024-01-01"), $lte: ISODate("2024-12-31") },
  })
  .explain("executionStats");
```

**Look for:**

- `executionTimeMillis` < 100ms for simple queries
- `totalDocsExamined` ≈ `nReturned` (index is being used)
- `stage: "IXSCAN"` (index scan, not collection scan)

### Optimization Tips

1. **Pagination**: Always use `limit` and `skip`

   ```typescript
   // Good
   await Reel.find(query).limit(20).skip(0);

   // Bad - loads all documents
   await Reel.find(query);
   ```

2. **Field Selection**: Only select needed fields

   ```typescript
   // Good
   await Reel.find(query).select("title summary thumbnailUrl tags");

   // Bad - loads all fields including large transcript
   await Reel.find(query);
   ```

3. **Lean Queries**: Use `.lean()` for read-only operations

   ```typescript
   // Good - returns plain JavaScript objects
   await Reel.find(query).lean();

   // Bad - returns Mongoose documents with overhead
   await Reel.find(query);
   ```

## 3. API Endpoint Benchmarks

### Target Response Times

| Endpoint                   | Target  | Acceptable | Notes                      |
| -------------------------- | ------- | ---------- | -------------------------- |
| POST /api/auth/register    | < 500ms | < 1s       | Includes bcrypt hashing    |
| POST /api/auth/login       | < 300ms | < 500ms    | Includes bcrypt comparison |
| GET /api/auth/me           | < 50ms  | < 100ms    | Simple DB lookup           |
| POST /api/reel/extract     | 10-20s  | < 30s      | AI processing intensive    |
| GET /api/reel              | < 100ms | < 200ms    | With pagination            |
| GET /api/reel/:id          | < 50ms  | < 100ms    | Single document            |
| PATCH /api/reel/:id        | < 100ms | < 200ms    | Update + folder count      |
| DELETE /api/reel/:id       | < 100ms | < 200ms    | Soft delete                |
| GET /api/folders           | < 50ms  | < 100ms    | Small dataset              |
| POST /api/folders          | < 100ms | < 200ms    | Create + validation        |
| GET /api/search            | < 200ms | < 500ms    | Text search with scoring   |
| GET /api/reel/filter       | < 150ms | < 300ms    | Multiple conditions        |
| GET /api/reel/filter/stats | < 200ms | < 400ms    | Aggregation queries        |

### Benchmarking with Apache Bench

```bash
# Test GET /api/reel endpoint
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/reel?limit=20

# Test search endpoint
ab -n 500 -c 5 -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/search?q=javascript&limit=10"
```

## 4. Resource Usage Monitoring

### Memory Usage

Monitor Node.js memory usage:

```typescript
// Add to index.ts for development
if (process.env.NODE_ENV === "development") {
  setInterval(() => {
    const used = process.memoryUsage();
    console.log("Memory Usage:");
    console.log(`  RSS: ${Math.round(used.rss / 1024 / 1024)}MB`);
    console.log(`  Heap Total: ${Math.round(used.heapTotal / 1024 / 1024)}MB`);
    console.log(`  Heap Used: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
  }, 30000); // Every 30 seconds
}
```

**Expected Memory Usage:**

- Idle: 50-100MB
- During reel extraction: 200-400MB (per concurrent extraction)
- With 100+ reels in DB: 100-150MB

### Temporary File Cleanup

Verify temp files are cleaned up:

```bash
# Check temp directory size
du -sh server/temp/

# List temp files
ls -lh server/temp/video/
ls -lh server/temp/audio/
```

**Expected:** Temp directory should be empty or < 10MB after processing completes.

### Database Connection Pool

Monitor MongoDB connections:

```typescript
import mongoose from "mongoose";

// Log connection stats
console.log("MongoDB Connection Stats:");
console.log(`  Ready State: ${mongoose.connection.readyState}`);
console.log(`  Host: ${mongoose.connection.host}`);
console.log(`  Name: ${mongoose.connection.name}`);
```

## 5. AI Service Performance

### API Rate Limits

**Gemini AI (Transcription):**

- Free tier: 15 requests/minute
- Paid tier: 60 requests/minute

**Groq AI (Summarization & OCR):**

- Free tier: 30 requests/minute
- Paid tier: Higher limits

### Monitoring AI Response Times

Add timing logs to AI services:

```typescript
// In aiTranscript.ts
const start = Date.now();
const result = await model.generateContent(prompt);
const duration = Date.now() - start;
console.log(`[Gemini] Transcription took ${duration}ms`);
```

### Optimization Strategies

1. **Batch Processing**: Process multiple reels in queue
2. **Caching**: Cache AI results for duplicate content
3. **Fallback Models**: Use faster models for simple content
4. **Retry Logic**: Implement exponential backoff for rate limits

## 6. Load Testing Scenarios

### Scenario 1: Normal Usage

- 10 users
- Each extracts 1 reel every 5 minutes
- Browse and search between extractions

**Expected:** All requests < 30s, no errors

### Scenario 2: Peak Load

- 50 concurrent users
- Mix of extractions, searches, and CRUD operations
- 5 extractions/minute across all users

**Expected:** Extraction queue builds up, but no failures

### Scenario 3: Database Stress

- 1000+ reels in database
- 20 concurrent search/filter requests
- Pagination through large result sets

**Expected:** Response times < 500ms with proper indexes

## 7. Performance Optimization Checklist

### Application Level

- [ ] Implement request rate limiting
- [ ] Add response caching for static data
- [ ] Use connection pooling for MongoDB
- [ ] Implement queue system for reel extraction
- [ ] Add request timeout handling
- [ ] Optimize image/video compression before upload

### Database Level

- [ ] Create all recommended indexes
- [ ] Monitor slow queries (> 100ms)
- [ ] Use aggregation pipeline for complex queries
- [ ] Implement database connection pooling
- [ ] Consider read replicas for high traffic

### Infrastructure Level

- [ ] Use CDN for static assets
- [ ] Implement Redis for session/cache
- [ ] Use load balancer for horizontal scaling
- [ ] Monitor server CPU/memory usage
- [ ] Set up application performance monitoring (APM)

## 8. Troubleshooting Performance Issues

### Slow Reel Extraction

**Symptoms:** Extraction takes > 30s

**Possible Causes:**

- Slow network (video download)
- AI API rate limiting
- Large video files (> 50MB)
- Cloudinary upload throttling

**Solutions:**

- Check network connectivity
- Verify AI API quotas
- Implement video size limits
- Use Cloudinary's eager transformations

### Slow Search Queries

**Symptoms:** Search takes > 500ms

**Possible Causes:**

- Missing text index
- Large result sets without pagination
- Complex search queries

**Solutions:**

- Verify text index exists: `db.reels.getIndexes()`
- Always use pagination
- Limit search to specific fields

### High Memory Usage

**Symptoms:** Memory > 500MB, crashes

**Possible Causes:**

- Memory leaks in video processing
- Too many concurrent extractions
- Large documents in memory

**Solutions:**

- Limit concurrent extractions
- Use streams for large files
- Implement garbage collection monitoring

## 9. Production Recommendations

1. **Monitoring**: Use APM tools (New Relic, Datadog, PM2)
2. **Logging**: Implement structured logging (Winston, Pino)
3. **Alerting**: Set up alerts for slow queries, high memory
4. **Scaling**: Use PM2 cluster mode or Kubernetes
5. **Caching**: Implement Redis for frequently accessed data
6. **Queue**: Use Bull/BullMQ for background jobs
7. **CDN**: Serve media through Cloudinary CDN
8. **Database**: Use MongoDB Atlas with auto-scaling

## 10. Performance Testing Schedule

**Development:**

- Run basic load tests before each release
- Monitor response times during feature development

**Staging:**

- Weekly load tests with production-like data
- Monthly stress tests with 2x expected load

**Production:**

- Continuous monitoring with APM
- Monthly performance audits
- Quarterly capacity planning reviews

---

**Last Updated:** December 2024
