# Multi-User Reel Extraction Fix

## Problem

The application was preventing multiple users from extracting the same Instagram reel URL. When User A extracted a reel, User B would get an error: **"This reel already exists in your collection"** even though it wasn't in User B's collection.

### Root Cause

The `Reel` model had a **global unique constraint** on the `sourceUrl` field:

```typescript
sourceUrl: {
  type: String,
  required: true,
  unique: true,  // ❌ PROBLEM: Global unique across ALL users
  index: true,
}
```

This created a MongoDB unique index that prevented ANY duplicate `sourceUrl` values in the entire database, regardless of which user owned the reel.

## Solution

Changed from a global unique constraint to a **compound unique index** on `(userId, sourceUrl)`:

```typescript
// Field definition (removed unique: true)
sourceUrl: {
  type: String,
  required: true,
  index: true,  // ✅ Regular index for queries
}

// Compound unique index (added to schema indexes)
reelSchema.index({ userId: 1, sourceUrl: 1 }, { unique: true });
// ✅ Each user can have their own copy of the same reel URL
```

## Changes Made

### 1. Model Update (`src/models/Reel.ts`)

**Before:**

```typescript
sourceUrl: {
  type: String,
  required: [true, "Source URL is required"],
  unique: true,  // Global unique
  index: true,
}
```

**After:**

```typescript
sourceUrl: {
  type: String,
  required: [true, "Source URL is required"],
  index: true,  // Regular index only
}

// Added compound unique index
reelSchema.index({ userId: 1, sourceUrl: 1 }, { unique: true });
```

### 2. Migration Script (`src/scripts/fix-reel-unique-index.ts`)

Created a migration script to:

1. Drop the old global unique index on `sourceUrl`
2. Create new compound unique index on `(userId, sourceUrl)`
3. Verify the changes

## How to Apply the Fix

### Step 1: Run the Migration Script

```bash
cd server
npx tsx src/scripts/fix-reel-unique-index.ts
```

Expected output:

```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📋 Current indexes:
  - _id_: {"_id":1}
  - sourceUrl_1: {"sourceUrl":1} (unique)
  - userId_1_createdAt_-1: {"userId":1,"createdAt":-1}

🗑️  Dropping old unique index on sourceUrl...
✅ Old unique index dropped

🔨 Creating new compound unique index on (userId, sourceUrl)...
✅ New compound unique index created

📋 Updated indexes:
  - _id_: {"_id":1}
  - userId_1_sourceUrl_1: {"userId":1,"sourceUrl":1} (unique)
  - userId_1_createdAt_-1: {"userId":1,"createdAt":-1}

✅ Migration completed successfully!
```

### Step 2: Restart the Server

```bash
npm run dev
```

The server will now use the updated model with the compound unique index.

## Behavior After Fix

### Before Fix ❌

```
User A extracts: instagram.com/reel/ABC123
✅ Success - Reel saved to User A's collection

User B tries to extract: instagram.com/reel/ABC123
❌ Error: "This reel already exists in your collection"
```

### After Fix ✅

```
User A extracts: instagram.com/reel/ABC123
✅ Success - Reel saved to User A's collection

User B extracts: instagram.com/reel/ABC123
✅ Success - Reel saved to User B's collection

User A tries to extract: instagram.com/reel/ABC123 again
❌ Error: "This reel already exists in your collection"
```

## Technical Details

### Compound Unique Index

The compound unique index `{ userId: 1, sourceUrl: 1 }` ensures:

1. **Per-User Uniqueness**: Each user can only have ONE copy of each reel URL
2. **Multi-User Support**: Different users CAN have the same reel URL
3. **Efficient Queries**: Index supports fast lookups by `(userId, sourceUrl)`

### Database Constraint

MongoDB enforces the uniqueness at the database level:

- Combination of `(userId, sourceUrl)` must be unique
- Same `sourceUrl` with different `userId` is allowed
- Same `userId` with different `sourceUrl` is allowed
- Same `userId` AND same `sourceUrl` is rejected

### Example Data

After fix, the database can have:

```javascript
// ✅ Allowed - Different users, same URL
{ userId: "user1", sourceUrl: "instagram.com/reel/ABC123" }
{ userId: "user2", sourceUrl: "instagram.com/reel/ABC123" }
{ userId: "user3", sourceUrl: "instagram.com/reel/ABC123" }

// ✅ Allowed - Same user, different URLs
{ userId: "user1", sourceUrl: "instagram.com/reel/ABC123" }
{ userId: "user1", sourceUrl: "instagram.com/reel/XYZ789" }

// ❌ Rejected - Same user, same URL (duplicate)
{ userId: "user1", sourceUrl: "instagram.com/reel/ABC123" }
{ userId: "user1", sourceUrl: "instagram.com/reel/ABC123" }  // Duplicate!
```

## Controller Logic

The controller already had the correct logic (no changes needed):

```typescript
// Check for duplicate URL per user
const existingReel = await Reel.findOne({
  sourceUrl: instagramUrl,
  userId, // ✅ Already checking per user
  isDeleted: false,
});

if (existingReel) {
  throw new ConflictError("This reel has already been extracted");
}
```

The controller was checking per-user, but the database constraint was global. Now both are aligned.

## Benefits

### 1. Multi-User Support

- ✅ Multiple users can extract the same popular reels
- ✅ Each user maintains their own collection
- ✅ No interference between users

### 2. Data Integrity

- ✅ Prevents duplicate reels within a user's collection
- ✅ Database-level constraint ensures consistency
- ✅ No orphaned or conflicting data

### 3. Performance

- ✅ Compound index improves query performance
- ✅ Fast duplicate detection per user
- ✅ Efficient lookups for user's reels

### 4. Scalability

- ✅ Supports unlimited users
- ✅ No global bottleneck on popular reels
- ✅ Horizontal scaling friendly

## Testing

### Test Case 1: Different Users, Same Reel

```bash
# User A extracts reel
POST /api/reel/extract
Authorization: Bearer <user_a_token>
Body: { "instagramUrl": "https://instagram.com/reel/ABC123" }
Expected: 201 Created

# User B extracts same reel
POST /api/reel/extract
Authorization: Bearer <user_b_token>
Body: { "instagramUrl": "https://instagram.com/reel/ABC123" }
Expected: 201 Created ✅
```

### Test Case 2: Same User, Duplicate Reel

```bash
# User A extracts reel
POST /api/reel/extract
Authorization: Bearer <user_a_token>
Body: { "instagramUrl": "https://instagram.com/reel/ABC123" }
Expected: 201 Created

# User A tries to extract same reel again
POST /api/reel/extract
Authorization: Bearer <user_a_token>
Body: { "instagramUrl": "https://instagram.com/reel/ABC123" }
Expected: 409 Conflict ✅
```

### Test Case 3: Same User, Different Reels

```bash
# User A extracts reel 1
POST /api/reel/extract
Authorization: Bearer <user_a_token>
Body: { "instagramUrl": "https://instagram.com/reel/ABC123" }
Expected: 201 Created

# User A extracts reel 2
POST /api/reel/extract
Authorization: Bearer <user_a_token>
Body: { "instagramUrl": "https://instagram.com/reel/XYZ789" }
Expected: 201 Created ✅
```

## Rollback (If Needed)

If you need to rollback to the old behavior:

```typescript
// Revert model changes
sourceUrl: {
  type: String,
  required: true,
  unique: true,  // Restore global unique
  index: true,
}

// Remove compound index
// reelSchema.index({ userId: 1, sourceUrl: 1 }, { unique: true });
```

Then run:

```bash
# Drop compound index
db.reels.dropIndex("userId_1_sourceUrl_1")

# Recreate global unique index
db.reels.createIndex({ sourceUrl: 1 }, { unique: true })
```

## Summary

- **Problem**: Global unique constraint prevented multi-user reel extraction
- **Solution**: Compound unique index on `(userId, sourceUrl)`
- **Result**: Each user can extract any reel, but only once per user
- **Migration**: Run `npx tsx src/scripts/fix-reel-unique-index.ts`
- **Status**: ✅ Fixed and ready for production
