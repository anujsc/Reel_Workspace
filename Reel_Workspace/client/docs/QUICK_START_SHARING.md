# Quick Start Guide - Folder Sharing Feature

## What's New? 🎉

You can now share your reel folders with friends via social media! Share your curated collections on WhatsApp, Facebook, Twitter, LinkedIn, Telegram, and Instagram.

## How to Use

### 1. Share a Folder

1. Open your dashboard
2. Click the folders icon (bottom navigation)
3. Hover over any folder
4. Click the **share icon** (📤) that appears
5. Set expiration (optional, default: 7 days)
6. Click "Create Share Link"

### 2. Share with Friends

Choose any option:

- **Copy Link**: Click the copy button and paste anywhere
- **WhatsApp**: Click to share directly on WhatsApp
- **Facebook**: Share on your Facebook timeline
- **Twitter**: Tweet the link to your followers
- **LinkedIn**: Share with your professional network
- **Telegram**: Send via Telegram
- **Instagram**: Opens Instagram (copy link manually)

### 3. Your Friend's Experience

- They click the link (no login needed!)
- See your folder name and all reels
- Browse reels in a beautiful grid
- Click "View Original" to watch on Instagram

### 4. Manage Your Share

- **View Count**: See how many people viewed
- **Deactivate**: Stop sharing anytime
- **Reactivate**: Create a new link whenever you want

## Features

✅ **No Login Required** - Friends can view without signing up
✅ **Social Media Integration** - One-click sharing to 6+ platforms
✅ **Expiration Control** - Set links to expire after X days
✅ **View Analytics** - Track how many times shared
✅ **Instant Deactivation** - Revoke access anytime
✅ **Secure Tokens** - Unique, unguessable share links

## Technical Details

### New Files Created

**Backend:**

- `server/src/models/FolderShare.ts` - Database model
- `server/src/controllers/share.controller.ts` - Share logic
- `server/src/routes/share.routes.ts` - API routes

**Frontend:**

- `client/src/components/ShareFolderDialog.tsx` - Share dialog
- `client/src/pages/SharedFolder.tsx` - Public viewing page

**Modified:**

- `server/src/index.ts` - Added share routes
- `client/src/App.tsx` - Added shared folder route
- `client/src/components/FoldersSheet.tsx` - Added share button
- `client/src/types/reel.ts` - Added emoji field

### API Endpoints

```
POST   /api/share/folder/:id          - Create share link
GET    /api/share/folder/:id/status   - Check share status
DELETE /api/share/folder/:id          - Deactivate share
GET    /api/share/:shareToken         - View shared folder (public)
```

### Dependencies Installed

**Backend:**

```bash
npm install nanoid
```

**Frontend:**

```bash
npm install react-share
```

## Environment Setup

Add to `server/.env`:

```env
CLIENT_URL=http://localhost:5173
```

## Testing Checklist

- [ ] Create share link
- [ ] Copy link works
- [ ] Social media buttons open correctly
- [ ] Open link in incognito (no auth)
- [ ] Reels display correctly
- [ ] View count increments
- [ ] Deactivate works
- [ ] Expired links show error

## Security

- **Unique Tokens**: 12-character random tokens (3.2 trillion combinations)
- **Owner Control**: Only folder owner can create/deactivate
- **Public Access**: View-only, no editing
- **Expiration**: Automatic access denial after expiry
- **Limited Data**: Only shows folder name, reels, and basic info

## Troubleshooting

**Share button not visible?**

- Hover over the folder in the folders sheet

**Link returns 404?**

- Check if link was deactivated
- Verify expiration date hasn't passed

**Social media not opening?**

- Check browser popup blocker
- Try copying link manually

## For Complete Documentation

See `FOLDER_SHARING_FEATURE.md` for:

- Detailed architecture
- Complete API documentation
- Security considerations
- Advanced testing scenarios
- Future enhancement ideas

---

**Ready to share your reel collections with the world!** 🚀
