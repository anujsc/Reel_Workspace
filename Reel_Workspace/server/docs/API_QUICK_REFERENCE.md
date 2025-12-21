# API Quick Reference - One Page Cheat Sheet

Quick reference for all API endpoints organized by feature.

---

## 🔐 Authentication (No Token Required)

```
POST /api/auth/register
Body: { "email": "user@example.com", "password": "pass123" }
→ Returns: User + Token

POST /api/auth/login
Body: { "email": "user@example.com", "password": "pass123" }
→ Returns: User + Token
```

---

## 📁 Folders (Token Required)

```
GET /api/folders
→ Returns: All user's folders

POST /api/folders
Body: { "name": "Technology", "color": "#3B82F6" }
→ Returns: New folder

GET /api/folders/:id
→ Returns: Single folder

PATCH /api/folders/:id
Body: { "name": "New Name", "color": "#10B981" }
→ Returns: Updated folder

DELETE /api/folders/:id
Query: ?strategy=move (optional)
→ Returns: 204 No Content
```

---

## 🎬 Reels (Token Required)

```
POST /api/reel/extract
Body: { "instagramUrl": "https://instagram.com/reel/ABC/" }
→ Takes: 30-60 seconds
→ Returns: Complete reel with AI features

GET /api/reel
Query: ?limit=20&skip=0&folderId=xxx (all optional)
→ Returns: Paginated reel list

GET /api/reel/:id
→ Returns: Complete reel details

PATCH /api/reel/:id
Body: { "title": "...", "folderId": "...", "tags": [...] }
→ Returns: Updated reel

DELETE /api/reel/:id
→ Returns: 204 No Content
```

---

## 🎯 Common Patterns

### Pagination

```
Page 1: GET /api/reel?limit=20&skip=0
Page 2: GET /api/reel?limit=20&skip=20
Page 3: GET /api/reel?limit=20&skip=40
```

### Filtering

```
By folder: GET /api/reel?folderId=abc123
With pagination: GET /api/reel?folderId=abc123&limit=10
```

### Headers (All Authenticated Requests)

```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

---

## 📊 Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

---

## 🎓 Reel Data Structure

Every reel includes:

- `videoUrl`, `thumbnailUrl` - Media files
- `title`, `transcript`, `summary` - Basic info
- `detailedExplanation` - 4-6 paragraphs
- `keyPoints` - Main takeaways (3-7 items)
- `examples` - Real-world examples (2-4 items)
- `relatedTopics` - Further learning (3-5 items)
- `actionableChecklist` - Steps to apply (3-5 items)
- `quizQuestions` - Test knowledge (2-3 questions)
- `quickReferenceCard` - Quick lookup (facts, definitions, formulas)
- `learningPath` - Progressive topics (3-5 items)
- `commonPitfalls` - Mistakes to avoid (2-3 items)
- `glossary` - Key terms (3-7 items)
- `interactivePromptSuggestions` - AI prompts (2-3 items)
- `tags` - Keywords
- `ocrText` - Extracted text from video

---

## ⚠️ Important Notes

1. **Token expires in 7 days** - Re-login when expired
2. **Reel extraction takes time** - Show loading state
3. **Folder counts auto-update** - No manual refresh needed
4. **Soft delete** - Deleted reels can be recovered
5. **Duplicate URLs rejected** - Same reel can't be saved twice
6. **Pagination limit** - Max 100 items per request
7. **Tags normalized** - Converted to lowercase automatically

---

## 🚨 Common Errors

| Code | Meaning      | Solution               |
| ---- | ------------ | ---------------------- |
| 400  | Bad Request  | Check request format   |
| 401  | Unauthorized | Add/refresh token      |
| 403  | Forbidden    | Can't perform action   |
| 404  | Not Found    | Resource doesn't exist |
| 409  | Conflict     | Duplicate resource     |
| 500  | Server Error | Contact support        |

---

## 💻 Code Examples

### JavaScript/Fetch

```javascript
// Login
const response = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "user@example.com", password: "pass123" }),
});
const { data } = await response.json();
const token = data.token;

// Get Reels
const reels = await fetch("http://localhost:5000/api/reel", {
  headers: { Authorization: `Bearer ${token}` },
});
const { data: reelData } = await reels.json();
```

### React Example

```javascript
// Extract Reel
const [loading, setLoading] = useState(false);

const extractReel = async (url) => {
  setLoading(true);
  try {
    const response = await fetch("http://localhost:5000/api/reel/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ instagramUrl: url }),
    });
    const result = await response.json();
    if (result.success) {
      // Show success, navigate to reel
      navigate(`/reel/${result.data.reel.id}`);
    }
  } catch (error) {
    // Show error message
  } finally {
    setLoading(false);
  }
};
```

---

## 🎨 UI Component Mapping

| Component           | API Call                  |
| ------------------- | ------------------------- |
| Login Form          | `POST /api/auth/login`    |
| Signup Form         | `POST /api/auth/register` |
| Folder Sidebar      | `GET /api/folders`        |
| Reel Grid           | `GET /api/reel?limit=20`  |
| Reel Detail         | `GET /api/reel/:id`       |
| Add Reel Form       | `POST /api/reel/extract`  |
| Edit Reel Form      | `PATCH /api/reel/:id`     |
| Create Folder Modal | `POST /api/folders`       |
| Delete Confirmation | `DELETE /api/reel/:id`    |

---

## 📱 Mobile App Considerations

1. **Cache aggressively** - Save folders and reels locally
2. **Offline mode** - Queue operations when offline
3. **Background processing** - Extract reels in background
4. **Push notifications** - Notify when extraction complete
5. **Image optimization** - Use thumbnail URLs for lists

---

## 🔄 State Management Tips

### Redux/Context Structure

```javascript
{
  auth: {
    user: { ... },
    token: "...",
    isAuthenticated: true
  },
  folders: {
    items: [ ... ],
    loading: false,
    error: null
  },
  reels: {
    items: [ ... ],
    currentReel: { ... },
    pagination: { total, limit, skip, hasMore },
    loading: false,
    error: null
  }
}
```

### Actions to Implement

- `LOGIN`, `LOGOUT`, `REGISTER`
- `FETCH_FOLDERS`, `CREATE_FOLDER`, `UPDATE_FOLDER`, `DELETE_FOLDER`
- `FETCH_REELS`, `FETCH_REEL`, `EXTRACT_REEL`, `UPDATE_REEL`, `DELETE_REEL`

---

## 🎯 Performance Optimization

1. **Lazy load reels** - Load 20 at a time
2. **Debounce search** - Wait 300ms before searching
3. **Cache API responses** - Use React Query or SWR
4. **Prefetch next page** - Load page 2 when viewing page 1
5. **Optimize images** - Use Cloudinary transformations

---

## 🧪 Testing Checklist

- [ ] User can register
- [ ] User can login
- [ ] User can create folder
- [ ] User can extract reel (wait 30-60s)
- [ ] User can view all reels
- [ ] User can view single reel
- [ ] User can update reel
- [ ] User can move reel to folder
- [ ] User can delete reel
- [ ] Folder counts update correctly
- [ ] Pagination works
- [ ] Folder filtering works
- [ ] Error messages display
- [ ] Loading states show

---

## 📚 Additional Resources

- **Full API Docs:** `API_DOCUMENTATION.md`
- **User Flow Guide:** `USER_FLOW_API_GUIDE.md`
- **Testing Guide:** `TESTING_GUIDE.md`
- **Postman Collection:** `REEL_CRUD_POSTMAN.json`

---

**Base URL:** `http://localhost:5000/api`

**Production URL:** Update when deployed

---

Last Updated: December 21, 2024
