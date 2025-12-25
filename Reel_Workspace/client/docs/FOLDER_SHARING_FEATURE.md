# Folder Sharing Feature - Complete Implementation Guide

## Overview

This document explains the complete folder sharing feature implementation from scratch, allowing users to share their reel folders with friends via social media platforms (WhatsApp, Facebook, Twitter, LinkedIn, Telegram, Instagram).

## Table of Contents

1. [Feature Description](#feature-description)
2. [Architecture](#architecture)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Usage Guide](#usage-guide)
8. [Security Considerations](#security-considerations)
9. [Testing](#testing)

---

## Feature Description

### What It Does

Users can generate a shareable link for any folder containing their reels. This link can be:

- Shared via social media platforms (WhatsApp, Facebook, Twitter, LinkedIn, Telegram)
- Accessed by anyone without authentication
- Set with an optional expiration date
- Deactivated at any time by the owner
- Tracked for view counts

### Key Features

- **Public Access**: No login required to view shared folders
- **Social Media Integration**: One-click sharing to popular platforms
- **Expiration Control**: Optional time-limited sharing (1-365 days)
- **View Analytics**: Track how many times the folder has been viewed
- **Link Management**: Deactivate/reactivate share links anytime
- **Secure Tokens**: Unique, unguessable share tokens using nanoid

---

## Architecture

### System Flow

```
User → Dashboard → Folder List → Share Button → Share Dialog
                                                      ↓
                                              Generate Share Link
                                                      ↓
                                    Copy Link / Share on Social Media
                                                      ↓
                                    Friend Receives Link → Opens URL
                                                      ↓
                                    Public Shared Folder Page (No Auth)
                                                      ↓
                                    View All Reels in Folder
```

### Technology Stack

- **Backend**: Node.js, Express, TypeScript, MongoDB
- **Frontend**: React, TypeScript, React Router, React Query
- **Sharing**: react-share library
- **Token Generation**: nanoid (12-character unique tokens)
- **Authentication**: JWT (for owner operations only)

---

## Backend Implementation

### 1. Database Model (`FolderShare.ts`)

```typescript
// Location: Reel_Workspace/server/src/models/FolderShare.ts

interface IFolderShare {
  folderId: ObjectId; // Reference to Folder
  userId: ObjectId; // Reference to User (owner)
  shareToken: string; // Unique 12-char token
  expiresAt?: Date; // Optional expiration
  isActive: boolean; // Enable/disable sharing
  viewCount: number; // Track views
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**

- `shareToken` (unique) - Fast lookup by token
- `{folderId, userId}` - Find shares by folder/user
- `{shareToken, isActive}` - Public access queries

### 2. Share Controller (`share.controller.ts`)

**Location**: `Reel_Workspace/server/src/controllers/share.controller.ts`

#### Key Functions:

**a) Create Share Link**

```typescript
POST /api/share/folder/:id
Body: { expiresInDays?: number }
Auth: Required (JWT)

// Generates unique token, creates FolderShare record
// Returns: { shareToken, shareUrl, expiresAt, viewCount }
```

**b) Get Shared Folder (Public)**

```typescript
GET /api/share/:shareToken
Auth: None (Public)

// Validates token, checks expiration
// Increments view count
// Returns: { folder, reels, viewCount, expiresAt }
```

**c) Deactivate Share**

```typescript
DELETE /api/share/folder/:id
Auth: Required (JWT)

// Sets isActive = false
// Link becomes inaccessible
```

**d) Get Share Status**

```typescript
GET /api/share/folder/:id/status
Auth: Required (JWT)

// Check if folder is currently shared
// Returns: { isShared, shareUrl, viewCount, expiresAt }
```

### 3. Routes (`share.routes.ts`)

**Location**: `Reel_Workspace/server/src/routes/share.routes.ts`

```typescript
router.post("/folder/:id", protect, createFolderShare);
router.get("/folder/:id/status", protect, getFolderShareStatus);
router.delete("/folder/:id", protect, deactivateFolderShare);
router.get("/:shareToken", getSharedFolder); // Public route
```

### 4. Server Integration

**Location**: `Reel_Workspace/server/src/index.ts`

```typescript
import { shareRoutes } from "./routes/share.routes.js";
app.use("/api/share", shareRoutes);
```

---

## Frontend Implementation

### 1. Share Dialog Component (`ShareFolderDialog.tsx`)

**Location**: `Reel_Workspace/client/src/components/ShareFolderDialog.tsx`

**Features:**

- Generate share link with optional expiration
- Copy link to clipboard
- Social media share buttons (WhatsApp, Facebook, Twitter, LinkedIn, Telegram)
- Deactivate share link
- View current share status

**Props:**

```typescript
interface ShareFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
  folderName: string;
}
```

**Social Media Integration:**

```typescript
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  TelegramShareButton,
} from "react-share";
```

### 2. Shared Folder Page (`SharedFolder.tsx`)

**Location**: `Reel_Workspace/client/src/pages/SharedFolder.tsx`

**Features:**

- Public page (no authentication required)
- Display folder name, color, reel count
- Show all reels in grid layout
- View count display
- Expiration date display
- Link to original Instagram reels
- Responsive design

**Route:**

```typescript
<Route path="/shared/:shareToken" element={<SharedFolder />} />
```

### 3. Folders Sheet Integration

**Location**: `Reel_Workspace/client/src/components/FoldersSheet.tsx`

**Changes:**

- Added share button (appears on hover) for each folder
- Opens ShareFolderDialog when clicked
- Prevents folder selection when share button clicked

```typescript
<Button
  size="icon-sm"
  variant="ghost"
  onClick={(e) => handleShareClick(e, folder)}
  className="opacity-0 group-hover:opacity-100"
>
  <Share2 className="w-4 h-4" />
</Button>
```

### 4. App Routing

**Location**: `Reel_Workspace/client/src/App.tsx`

```typescript
import SharedFolder from "./pages/SharedFolder";

<Route path="/shared/:shareToken" element={<SharedFolder />} />;
```

---

## Database Schema

### FolderShare Collection

```javascript
{
  _id: ObjectId,
  folderId: ObjectId,           // Reference to folders collection
  userId: ObjectId,             // Reference to users collection
  shareToken: "abc123xyz789",   // 12-char unique token
  expiresAt: ISODate("2025-01-01T00:00:00Z"), // Optional
  isActive: true,               // Can be toggled
  viewCount: 42,                // Incremented on each view
  createdAt: ISODate("2024-12-25T10:00:00Z"),
  updatedAt: ISODate("2024-12-25T10:00:00Z")
}
```

**Relationships:**

- `folderId` → `folders._id`
- `userId` → `users._id`

---

## API Endpoints

### 1. Create Folder Share

```http
POST /api/share/folder/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "expiresInDays": 7  // Optional (1-365)
}

Response 201:
{
  "success": true,
  "data": {
    "shareToken": "abc123xyz789",
    "shareUrl": "http://localhost:5173/shared/abc123xyz789",
    "expiresAt": "2025-01-01T00:00:00Z",
    "viewCount": 0
  },
  "message": "Folder share created successfully"
}
```

### 2. Get Shared Folder (Public)

```http
GET /api/share/:shareToken

Response 200:
{
  "success": true,
  "data": {
    "folder": {
      "id": "...",
      "name": "Cooking Tips",
      "color": "#3B82F6",
      "reelCount": 15
    },
    "reels": [
      {
        "id": "...",
        "title": "Perfect Pasta Recipe",
        "summary": "Learn to cook pasta like a pro",
        "thumbnailUrl": "https://...",
        "videoUrl": "https://...",
        "sourceUrl": "https://instagram.com/...",
        "tags": ["cooking", "pasta"],
        "createdAt": "2024-12-20T10:00:00Z"
      }
    ],
    "viewCount": 42,
    "expiresAt": "2025-01-01T00:00:00Z"
  },
  "message": "Shared folder retrieved successfully"
}
```

### 3. Get Share Status

```http
GET /api/share/folder/:id/status
Authorization: Bearer <token>

Response 200 (Shared):
{
  "success": true,
  "data": {
    "isShared": true,
    "shareToken": "abc123xyz789",
    "shareUrl": "http://localhost:5173/shared/abc123xyz789",
    "expiresAt": "2025-01-01T00:00:00Z",
    "viewCount": 42,
    "createdAt": "2024-12-25T10:00:00Z"
  },
  "message": "Folder share status retrieved"
}

Response 200 (Not Shared):
{
  "success": true,
  "data": {
    "isShared": false
  },
  "message": "Folder is not shared"
}
```

### 4. Deactivate Share

```http
DELETE /api/share/folder/:id
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "shareToken": "abc123xyz789",
    "isActive": false
  },
  "message": "Folder share deactivated successfully"
}
```

---

## Usage Guide

### For Folder Owners

#### Step 1: Share a Folder

1. Open the Folders sheet (bottom navigation)
2. Hover over any folder
3. Click the share icon (appears on hover)
4. In the dialog:
   - Set expiration days (optional, default: 7 days)
   - Click "Create Share Link"

#### Step 2: Share the Link

1. **Copy Link**: Click copy button to copy URL
2. **Social Media**: Click platform buttons to share directly
   - WhatsApp: Opens WhatsApp with pre-filled message
   - Facebook: Opens Facebook share dialog
   - Twitter: Opens Twitter compose with link
   - LinkedIn: Opens LinkedIn share dialog
   - Telegram: Opens Telegram with message

#### Step 3: Manage Share

- **View Stats**: See view count in the dialog
- **Deactivate**: Click "Deactivate Share Link" to disable access
- **Reactivate**: Create a new share link anytime

### For Recipients

#### Viewing Shared Folders

1. Click the shared link (e.g., `https://yourapp.com/shared/abc123xyz789`)
2. View folder details:
   - Folder name and color
   - Number of reels
   - View count
   - Expiration date (if set)
3. Browse reels in grid layout
4. Click "View Original" on any reel to open Instagram

**No login required!**

---

## Security Considerations

### 1. Token Security

- **Unique Tokens**: 12-character nanoid tokens (62^12 = 3.2 trillion combinations)
- **Unpredictable**: Cryptographically random, not sequential
- **No User Data**: Tokens don't expose user IDs or folder IDs

### 2. Access Control

- **Owner Operations**: Create/deactivate requires JWT authentication
- **Public Access**: View shared folder requires only valid token
- **Expiration**: Automatic access denial after expiration date
- **Deactivation**: Owner can revoke access instantly

### 3. Data Exposure

- **Limited Data**: Shared view shows only:
  - Folder name, color, reel count
  - Reel title, summary, thumbnail, tags
  - Original Instagram links
- **Protected Data**: Not exposed:
  - User email/password
  - Other folders
  - Detailed reel analytics
  - Transcripts, OCR text, learning materials

### 4. Rate Limiting (Recommended)

Consider adding rate limiting to prevent abuse:

```typescript
// Example: Limit public share endpoint
import rateLimit from "express-rate-limit";

const shareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
});

router.get("/:shareToken", shareLimiter, getSharedFolder);
```

### 5. Environment Variables

```env
# .env file
CLIENT_URL=http://localhost:5173  # Frontend URL for share links
JWT_SECRET=your-secret-key        # For owner authentication
```

---

## Testing

### Backend Tests

#### 1. Create Share Link

```bash
# Test authenticated user can create share
curl -X POST http://localhost:5000/api/share/folder/<folder-id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"expiresInDays": 7}'

# Expected: 201 with shareToken and shareUrl
```

#### 2. Get Shared Folder (Public)

```bash
# Test public access without auth
curl http://localhost:5000/api/share/<share-token>

# Expected: 200 with folder and reels
```

#### 3. Expired Link

```bash
# Create share with 0 days expiration
# Wait 1 day
# Try to access

# Expected: 404 "This share link has expired"
```

#### 4. Deactivate Share

```bash
curl -X DELETE http://localhost:5000/api/share/folder/<folder-id> \
  -H "Authorization: Bearer <token>"

# Expected: 200 with isActive: false
# Then try to access share token
# Expected: 404 "Shared folder not found or link is inactive"
```

### Frontend Tests

#### 1. Share Dialog

- Open folder sheet
- Hover over folder → Share button appears
- Click share → Dialog opens
- Set expiration → Create link
- Verify link appears
- Click copy → Verify clipboard
- Click social buttons → Verify opens correct platform

#### 2. Shared Folder Page

- Open share URL in incognito window (no auth)
- Verify folder details display
- Verify reels grid displays
- Click "View Original" → Opens Instagram
- Verify view count increments

#### 3. Expiration

- Create share with 1 day expiration
- Verify expiration date displays
- After expiration, verify error message

### Manual Testing Checklist

- [ ] Create share link for folder
- [ ] Copy link to clipboard
- [ ] Share on WhatsApp (opens WhatsApp)
- [ ] Share on Facebook (opens Facebook)
- [ ] Share on Twitter (opens Twitter)
- [ ] Share on LinkedIn (opens LinkedIn)
- [ ] Share on Telegram (opens Telegram)
- [ ] Open shared link in incognito (no login)
- [ ] Verify folder name and color display
- [ ] Verify reels display correctly
- [ ] Click "View Original" on reel
- [ ] Verify view count increments
- [ ] Deactivate share link
- [ ] Verify link no longer works
- [ ] Create new share link
- [ ] Verify new link works
- [ ] Test expired link (set 0 days)

---

## Installation & Setup

### 1. Install Dependencies

**Backend:**

```bash
cd Reel_Workspace/server
npm install nanoid
```

**Frontend:**

```bash
cd Reel_Workspace/client
npm install react-share
```

### 2. Environment Variables

Add to `Reel_Workspace/server/.env`:

```env
CLIENT_URL=http://localhost:5173
```

### 3. Database Migration

No migration needed! The FolderShare collection will be created automatically on first use.

### 4. Start Services

**Backend:**

```bash
cd Reel_Workspace/server
npm run dev
```

**Frontend:**

```bash
cd Reel_Workspace/client
npm run dev
```

### 5. Verify Installation

1. Login to your account
2. Open folders sheet
3. Hover over a folder
4. Verify share button appears
5. Click share button
6. Verify dialog opens
7. Create share link
8. Copy link and open in incognito
9. Verify shared folder page loads

---

## Troubleshooting

### Issue: Share button not appearing

**Solution**: Ensure FoldersSheet.tsx has been updated with share button code

### Issue: "Module not found: nanoid"

**Solution**: Run `npm install nanoid` in server directory

### Issue: "Module not found: react-share"

**Solution**: Run `npm install react-share` in client directory

### Issue: Share link returns 404

**Solution**:

- Verify share route is registered in server/src/index.ts
- Check MongoDB connection
- Verify shareToken is correct

### Issue: Social media buttons not working

**Solution**:

- Verify react-share is installed
- Check browser console for errors
- Ensure share URL is valid

### Issue: Shared page shows "Folder Not Found"

**Solution**:

- Check if share link is active (not deactivated)
- Verify expiration date hasn't passed
- Check MongoDB for FolderShare record

---

## Future Enhancements

### Potential Features

1. **Password Protection**: Add optional password for share links
2. **Custom Expiration**: Allow specific date/time selection
3. **Share Analytics**: Track which platforms generate most views
4. **Email Sharing**: Send share link via email
5. **QR Code**: Generate QR code for easy mobile sharing
6. **Embed Code**: Allow embedding shared folder on websites
7. **Download Option**: Allow downloading all reels in folder
8. **Comments**: Allow viewers to leave comments
9. **Reactions**: Add like/favorite functionality
10. **Share History**: Track all past shares and their analytics

### Code Improvements

1. Add rate limiting to prevent abuse
2. Add caching for frequently accessed shares
3. Add pagination for folders with many reels
4. Add search/filter on shared folder page
5. Add SEO meta tags for shared pages
6. Add Open Graph tags for better social previews

---

## Summary

The folder sharing feature is now fully implemented with:

✅ **Backend**: Share token generation, public access, expiration, view tracking
✅ **Frontend**: Share dialog, social media integration, public viewing page
✅ **Security**: Token-based access, owner authentication, expiration control
✅ **UX**: One-click sharing, copy to clipboard, responsive design
✅ **Analytics**: View count tracking

Users can now easily share their reel collections with friends via any social media platform, with full control over access and expiration!

---

## Support

For issues or questions:

1. Check this documentation
2. Review the code comments
3. Check browser/server console for errors
4. Verify all dependencies are installed
5. Ensure environment variables are set correctly

Happy sharing! 🎉
