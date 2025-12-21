# User Flow API Guide - Simple & Easy to Understand

This guide explains which API to use for each task in your Reel Workspace app, organized by user journey.

---

## 🚀 Getting Started Flow

### 1. User Wants to Sign Up

**API:** `POST /api/auth/register`

**What it does:** Creates a new user account

**When to use:** First time user wants to create an account

**Example:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**You get back:** User info + authentication token

---

### 2. User Wants to Login

**API:** `POST /api/auth/login`

**What it does:** Logs in existing user

**When to use:** User already has an account and wants to login

**Example:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**You get back:** User info + authentication token (save this token!)

---

## 📁 Organizing Reels Flow

### 3. User Wants to See All Their Folders

**API:** `GET /api/folders`

**What it does:** Shows all folders user has created

**When to use:**

- User opens the app and wants to see their folders
- User wants to organize their reels
- Showing folder list in sidebar/navigation

**You get back:** List of all folders with names, colors, and reel counts

---

### 4. User Wants to Create a New Folder

**API:** `POST /api/folders`

**What it does:** Creates a new folder to organize reels

**When to use:**

- User clicks "Create Folder" button
- User wants to organize reels by category

**Example:**

```json
{
  "name": "Technology",
  "color": "#3B82F6"
}
```

**You get back:** The newly created folder

---

### 5. User Wants to Rename or Change Folder Color

**API:** `PATCH /api/folders/:id`

**What it does:** Updates folder name or color

**When to use:**

- User clicks "Edit Folder" button
- User wants to change folder appearance

**Example:**

```json
{
  "name": "Tech & Innovation",
  "color": "#10B981"
}
```

**You get back:** Updated folder information

---

### 6. User Wants to Delete a Folder

**API:** `DELETE /api/folders/:id`

**What it does:** Deletes a folder

**When to use:**

- User clicks "Delete Folder" button
- User no longer needs a folder

**Two options:**

- Without `?strategy=move` - Fails if folder has reels (safe)
- With `?strategy=move` - Moves reels to "Uncategorized" folder

**You get back:** Success (no content)

---

## 🎬 Working with Reels Flow

### 7. User Wants to Save an Instagram Reel

**API:** `POST /api/reel/extract`

**What it does:**

- Downloads the Instagram reel
- Extracts audio and creates transcript
- Generates AI summary with learning features
- Saves everything to database

**When to use:**

- User pastes Instagram reel URL
- User clicks "Save Reel" or "Extract" button

**Example:**

```json
{
  "instagramUrl": "https://www.instagram.com/reel/ABC123/"
}
```

**Takes:** 30-60 seconds to process

**You get back:** Complete reel with:

- Video and thumbnail
- Full transcript
- AI-generated summary
- 7 interactive learning features:
  1. Actionable checklist
  2. Quiz questions
  3. Quick reference card
  4. Learning path
  5. Common pitfalls
  6. Glossary
  7. AI prompt suggestions
- Auto-assigned to appropriate folder

---

### 8. User Wants to See All Their Saved Reels

**API:** `GET /api/reel`

**What it does:** Shows all reels user has saved

**When to use:**

- User opens the app home screen
- User wants to browse their saved reels
- Showing reel grid/list view

**Optional filters:**

- `?limit=20` - How many reels to show (default: 20)
- `?skip=0` - For pagination (skip first N reels)
- `?folderId=xxx` - Show only reels from specific folder

**Examples:**

- All reels: `GET /api/reel`
- First 10 reels: `GET /api/reel?limit=10&skip=0`
- Next 10 reels: `GET /api/reel?limit=10&skip=10`
- Reels in folder: `GET /api/reel?folderId=abc123`

**You get back:** List of reels with pagination info

---

### 9. User Clicks on a Reel to View Details

**API:** `GET /api/reel/:id`

**What it does:** Gets complete information about one reel

**When to use:**

- User clicks on a reel card
- User wants to see full details
- Opening reel detail page

**You get back:** Complete reel data including:

- Video and thumbnail
- Full transcript
- Summary and detailed explanation
- All 7 interactive learning features
- Tags and folder info

---

### 10. User Wants to Edit Reel Title

**API:** `PATCH /api/reel/:id`

**What it does:** Updates reel title

**When to use:**

- User clicks "Edit Title" button
- User wants to give reel a custom name

**Example:**

```json
{
  "title": "My Custom Title"
}
```

**You get back:** Updated reel

---

### 11. User Wants to Move Reel to Different Folder

**API:** `PATCH /api/reel/:id`

**What it does:** Moves reel to another folder

**When to use:**

- User drags reel to different folder
- User selects "Move to Folder" option
- User wants to reorganize reels

**Example:**

```json
{
  "folderId": "folder123"
}
```

**You get back:** Updated reel with new folder

**Note:** Folder counts update automatically!

---

### 12. User Wants to Update Reel Tags

**API:** `PATCH /api/reel/:id`

**What it does:** Changes reel tags for better organization

**When to use:**

- User wants to add custom tags
- User wants to improve searchability

**Example:**

```json
{
  "tags": ["technology", "ai", "learning", "tutorial"]
}
```

**You get back:** Updated reel with new tags

---

### 13. User Wants to Update Multiple Things at Once

**API:** `PATCH /api/reel/:id`

**What it does:** Updates title, folder, and tags together

**When to use:**

- User edits multiple fields in edit form
- Bulk update operation

**Example:**

```json
{
  "title": "New Title",
  "folderId": "folder123",
  "tags": ["tag1", "tag2"]
}
```

**You get back:** Fully updated reel

---

### 14. User Wants to Delete a Reel

**API:** `DELETE /api/reel/:id`

**What it does:** Deletes a reel (soft delete - can be recovered)

**When to use:**

- User clicks "Delete" button
- User wants to remove a reel

**You get back:** Success (no content)

**Note:** Folder reel count decreases automatically!

---

## 🔍 Common User Scenarios

### Scenario 1: New User First Time Setup

```
1. POST /api/auth/register     → Create account
2. GET /api/folders             → See default folders (if any)
3. POST /api/folders            → Create first folder
```

---

### Scenario 2: User Saves Their First Reel

```
1. POST /api/auth/login         → Login
2. POST /api/reel/extract       → Save Instagram reel (30-60 sec)
3. GET /api/reel                → See saved reel in list
4. GET /api/reel/:id            → View full details
```

---

### Scenario 3: User Organizes Their Reels

```
1. GET /api/folders             → See all folders
2. POST /api/folders            → Create new folder
3. GET /api/reel                → See all reels
4. PATCH /api/reel/:id          → Move reel to new folder
5. GET /api/folders             → Verify folder counts updated
```

---

### Scenario 4: User Browses Reels by Folder

```
1. GET /api/folders             → Get all folders
2. User clicks on "Technology" folder
3. GET /api/reel?folderId=xxx   → Show only Technology reels
4. User clicks on a reel
5. GET /api/reel/:id            → Show full reel details
```

---

### Scenario 5: User Wants to Learn from a Reel

```
1. GET /api/reel/:id            → Get reel details
2. Display on screen:
   - Watch video
   - Read transcript
   - Read summary
   - Follow actionable checklist
   - Take quiz questions
   - Review quick reference card
   - Follow learning path
   - Avoid common pitfalls
   - Learn glossary terms
   - Use AI prompt suggestions
```

---

## 📱 UI Component → API Mapping

### Home Screen / Dashboard

- **Show all reels:** `GET /api/reel?limit=20&skip=0`
- **Show folders sidebar:** `GET /api/folders`
- **Pagination (next page):** `GET /api/reel?limit=20&skip=20`

---

### Folder View Screen

- **Show folder reels:** `GET /api/reel?folderId=xxx`
- **Create folder button:** `POST /api/folders`
- **Edit folder button:** `PATCH /api/folders/:id`
- **Delete folder button:** `DELETE /api/folders/:id`

---

### Add Reel Screen

- **Extract button:** `POST /api/reel/extract`
- **Show progress:** Wait 30-60 seconds
- **Show success:** Navigate to reel detail

---

### Reel Detail Screen

- **Load reel:** `GET /api/reel/:id`
- **Edit title:** `PATCH /api/reel/:id`
- **Move to folder:** `PATCH /api/reel/:id`
- **Update tags:** `PATCH /api/reel/:id`
- **Delete reel:** `DELETE /api/reel/:id`

---

### Learning Features Display

All data comes from: `GET /api/reel/:id`

Display these sections:

1. **Video Player** - Show `videoUrl`
2. **Transcript Tab** - Show `transcript`
3. **Summary Tab** - Show `summary` and `detailedExplanation`
4. **Key Points** - Show `keyPoints` as bullet list
5. **Examples** - Show `examples` as cards
6. **Checklist** - Show `actionableChecklist` with checkboxes
7. **Quiz** - Show `quizQuestions` as interactive quiz
8. **Quick Reference** - Show `quickReferenceCard` as table
9. **Learning Path** - Show `learningPath` as progression
10. **Pitfalls** - Show `commonPitfalls` as warning cards
11. **Glossary** - Show `glossary` as expandable list
12. **AI Prompts** - Show `interactivePromptSuggestions` as buttons

---

## 🔐 Authentication Rules

### All APIs Except These Need Token:

- ✅ `POST /api/auth/register` - No token needed
- ✅ `POST /api/auth/login` - No token needed
- ✅ `GET /api/health` - No token needed

### All Other APIs Need Token:

Add this header to every request:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

**How to get token:**

1. User registers or logs in
2. Save the token from response
3. Include token in all future requests

---

## ⚡ Quick Reference Table

| User Action         | API Endpoint         | Method | Needs Token |
| ------------------- | -------------------- | ------ | ----------- |
| Sign up             | `/api/auth/register` | POST   | ❌          |
| Login               | `/api/auth/login`    | POST   | ❌          |
| See all folders     | `/api/folders`       | GET    | ✅          |
| Create folder       | `/api/folders`       | POST   | ✅          |
| Edit folder         | `/api/folders/:id`   | PATCH  | ✅          |
| Delete folder       | `/api/folders/:id`   | DELETE | ✅          |
| Save Instagram reel | `/api/reel/extract`  | POST   | ✅          |
| See all reels       | `/api/reel`          | GET    | ✅          |
| See one reel        | `/api/reel/:id`      | GET    | ✅          |
| Edit reel           | `/api/reel/:id`      | PATCH  | ✅          |
| Delete reel         | `/api/reel/:id`      | DELETE | ✅          |

---

## 💡 Pro Tips

### For Better Performance:

1. **Use pagination** - Don't load all reels at once

   - `GET /api/reel?limit=20&skip=0`

2. **Filter by folder** - Show only relevant reels

   - `GET /api/reel?folderId=xxx`

3. **Cache folder list** - Folders don't change often
   - Load once, refresh only when user creates/edits

### For Better UX:

1. **Show loading state** - Reel extraction takes 30-60 seconds
2. **Show progress** - Display "Processing..." message
3. **Handle errors** - Show friendly error messages
4. **Auto-refresh** - Refresh folder counts after moving reels

### For Better Organization:

1. **Auto-suggest folders** - AI suggests folder based on content
2. **Show reel counts** - Display count in folder badges
3. **Sort by date** - Newest reels first (API does this automatically)
4. **Tag filtering** - Use tags for advanced search (future feature)

---

## 🎯 Summary

**3 Main Flows:**

1. **Authentication Flow**

   - Register → Login → Get Token

2. **Folder Management Flow**

   - Get Folders → Create → Edit → Delete

3. **Reel Management Flow**
   - Extract → View All → View One → Edit → Delete

**Remember:**

- Always include token in headers (except auth endpoints)
- Reel extraction takes 30-60 seconds
- Folder counts update automatically
- All reels have 7 interactive learning features
- Use pagination for better performance

---

## 📞 Need Help?

- **API Documentation:** See `API_DOCUMENTATION.md` for technical details
- **Testing Guide:** See `TESTING_GUIDE.md` for testing examples
- **Postman Collection:** Import `REEL_CRUD_POSTMAN.json` for testing

---

**Happy Building! 🚀**
