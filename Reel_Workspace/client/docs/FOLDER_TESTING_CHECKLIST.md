# Folder Management Testing Checklist

## Setup

1. ✅ Start the development server: `npm run dev`
2. ✅ Ensure backend API is running on port 5000
3. ✅ Login to the application

## Test Cases

### 1. Sidebar Display

- [ ] Sidebar appears on left side (desktop)
- [ ] "ReelMind" logo and "Knowledge Workspace" subtitle visible
- [ ] "All Reels" shows total reel count
- [ ] "Uncategorized" shows uncategorized reel count
- [ ] "Folders" section is collapsible
- [ ] "+ New Folder" button is visible
- [ ] "Sign Out" button in footer

### 2. Create Folder

- [ ] Click "+ New Folder" button
- [ ] Modal opens with title "Create New Folder"
- [ ] Enter folder name (e.g., "Finance Tips")
- [ ] Select a color from the color picker
- [ ] Click "Create Folder"
- [ ] Success toast appears
- [ ] New folder appears in sidebar
- [ ] Folder shows with selected color dot
- [ ] Folder shows "0" reel count initially

### 3. Folder Display

- [ ] Each folder shows:
  - [ ] Colored dot indicator
  - [ ] Folder name
  - [ ] Reel count badge
- [ ] Hover over folder shows three-dot menu
- [ ] Three-dot menu has "Rename" and "Delete" options

### 4. Rename Folder

- [ ] Hover over a folder
- [ ] Click three-dot menu
- [ ] Click "Rename"
- [ ] Modal opens with current name pre-filled
- [ ] Change the name
- [ ] Click "Rename"
- [ ] Success toast appears
- [ ] Folder name updates in sidebar

### 5. Delete Folder

- [ ] Hover over a non-default folder
- [ ] Click three-dot menu
- [ ] Click "Delete"
- [ ] Confirmation dialog appears
- [ ] Dialog shows reel count if folder has reels
- [ ] Dialog warns about moving reels to Uncategorized
- [ ] Click "Delete"
- [ ] Success toast appears
- [ ] Folder removed from sidebar
- [ ] Reels moved to Uncategorized

### 6. Default Folder Protection

- [ ] Try to delete a default folder
- [ ] "Delete" option should be disabled
- [ ] Or dialog should prevent deletion

### 7. Folder Filtering

- [ ] Click "All Reels"
- [ ] URL shows `/dashboard` (no params)
- [ ] All reels displayed
- [ ] Click "Uncategorized"
- [ ] URL shows `/dashboard?folder=uncategorized`
- [ ] Only uncategorized reels displayed
- [ ] Click a specific folder
- [ ] URL shows `/dashboard?folder=<folder-id>`
- [ ] Only reels in that folder displayed
- [ ] Reel count in header updates correctly

### 8. Active Folder Highlighting

- [ ] Click different folders
- [ ] Active folder has highlighted background
- [ ] Active folder text is bold
- [ ] Previous selection is unhighlighted

### 9. Mobile Responsiveness

- [ ] Resize browser to mobile width
- [ ] Sidebar is hidden
- [ ] Hamburger menu button appears in header
- [ ] Click hamburger menu
- [ ] Sidebar slides in as overlay
- [ ] Click a folder
- [ ] Sidebar closes automatically
- [ ] Dashboard filters by selected folder

### 10. Search with Folder Filter

- [ ] Select a folder
- [ ] Enter search query
- [ ] Results filtered by both folder AND search
- [ ] Clear search
- [ ] Results show all reels in folder

### 11. Sign Out

- [ ] Click "Sign Out" button in sidebar footer
- [ ] Success toast appears
- [ ] Redirected to login page

### 12. URL Direct Access

- [ ] Copy a folder URL (e.g., `/dashboard?folder=abc123`)
- [ ] Open in new tab
- [ ] Correct folder is selected
- [ ] Correct reels are displayed

### 13. Error Handling

- [ ] Try creating folder with empty name
- [ ] Error toast appears
- [ ] Try creating folder with network error
- [ ] Error toast with message appears
- [ ] Try deleting folder with network error
- [ ] Error toast with message appears

### 14. Loading States

- [ ] Refresh page
- [ ] Sidebar shows "Loading..." while fetching folders
- [ ] Create folder button shows "Creating..." during mutation
- [ ] Rename button shows "Renaming..." during mutation
- [ ] Delete button shows "Deleting..." during mutation

### 15. Query Invalidation

- [ ] Create a new folder
- [ ] Folder list updates immediately
- [ ] Rename a folder
- [ ] Folder list updates immediately
- [ ] Delete a folder
- [ ] Folder list updates immediately
- [ ] Reel counts update after folder operations

## Expected API Calls

### On Page Load

- `GET /api/folders` - Fetch all folders
- `GET /api/reel?limit=20&skip=0` - Fetch all reels

### Create Folder

- `POST /api/folders` with `{ name: "...", color: "..." }`
- `GET /api/folders` - Refetch folders

### Rename Folder

- `PATCH /api/folders/:id` with `{ name: "..." }`
- `GET /api/folders` - Refetch folders

### Delete Folder

- `DELETE /api/folders/:id`
- `GET /api/folders` - Refetch folders
- `GET /api/reel?...` - Refetch reels

### Filter by Folder

- `GET /api/reel?limit=20&skip=0&folder=<folder-id>`

## Notes

- All mutations should show toast notifications
- All mutations should invalidate relevant queries
- URL should update when folder selection changes
- Folder colors should be visually distinct
- Three-dot menu should only appear on hover
- Default folders cannot be deleted
