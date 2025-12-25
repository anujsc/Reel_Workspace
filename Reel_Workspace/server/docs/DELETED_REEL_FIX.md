# Deleted Reel Re-extraction Fix

## Problem

When a user deleted a reel and then tried to re-extract the same Instagram URL, they received an error: "This reel already exists in your collection."

## Root Cause

The unique index on `(userId, sourceUrl)` in the Reel model didn't account for soft-deleted reels. When a reel was deleted:

1. The `isDeleted` flag was set to `true`
2. The document remained in the database
3. MongoDB's unique index prevented creating a new document with the same `(userId, sourceUrl)` combination

## Solution

Updated the unique index to be a **partial index** that only enforces uniqueness on non-deleted reels:

```typescript
reelSchema.index(
  { userId: 1, sourceUrl: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);
```

This allows multiple documents with the same `(userId, sourceUrl)` as long as only one has `isDeleted: false`.

## Migration Required

After updating the code, you must run the migration script to update the database index:

```bash
cd Reel_Workspace/server
npm run migrate:fix-reel-index
```

The migration script will:

1. Drop the old unique index
2. Create the new partial unique index
3. Allow users to re-extract deleted reels

## Testing

After running the migration:

1. Delete a reel from your collection
2. Try to extract the same Instagram URL again
3. The extraction should succeed without errors

## Files Modified

- `src/models/Reel.ts` - Updated unique index definition
- `src/scripts/fix-reel-index.ts` - Migration script (new)
- `package.json` - Added migration script command
