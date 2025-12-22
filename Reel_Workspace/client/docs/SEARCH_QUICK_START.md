# Search & Filter Quick Start Guide

## For Users

### How to Search

1. **Type in the search bar** on the Dashboard
2. **Press Enter** to see full search results
3. Results show with **highlighted keywords**
4. Click any reel to view details

### How to Filter

1. **Click "Filters" button** (top right)
2. **Select your filters:**
   - Date Range: Last 7 days, Last month, or Custom
   - Folders: Check folders you want to include
   - Tags: Check tags you want to include
3. **Click "Apply Filters"**
4. Results update immediately

### How to Combine Search + Filters

1. **Type search query** and press Enter
2. **Click "Filters"** on search results page
3. **Select filters** and apply
4. Results show reels matching BOTH search AND filters

### How to Remove Filters

- **Click X** on any filter chip below search bar
- **Click "Clear All"** in filter panel to remove all filters

## For Developers

### Quick Implementation Check

#### 1. Test Search

```typescript
// Dashboard search input
<Input
  value={searchQuery}
  onChange={handleSearchChange}
  onKeyDown={handleSearchKeyDown}
  placeholder="Search reels... (Press Enter)"
/>
```

#### 2. Test Debounce

```typescript
const debouncedSearchQuery = useDebounce(searchQuery, 500);
// Should wait 500ms before triggering
```

#### 3. Test Search API

```typescript
const { data } = useSearch({
  query: "test",
  filters: {
    tags: ["finance"],
    folders: ["folder-id"],
    dateRange: { start: "2024-01-01" },
  },
});
```

#### 4. Test Highlighting

```typescript
<ReelCard reel={reel} highlightQuery="keyword" />
// Should highlight "keyword" in title and summary
```

### API Endpoints Needed

#### Search Endpoint

```typescript
GET /api/search?q=query&tags=tag1,tag2&folders=id1,id2&startDate=2024-01-01&endDate=2024-12-31

Response:
{
  "success": true,
  "data": [/* reels */],
  "meta": { "total": 10 }
}
```

#### Filter Endpoint

```typescript
GET /api/reel/filter?tags=tag1,tag2&folders=id1,id2&startDate=2024-01-01&limit=20&skip=0

Response:
{
  "success": true,
  "data": [/* reels */],
  "meta": { "total": 10, "limit": 20, "skip": 0 }
}
```

### Common Issues & Solutions

#### Issue: Search not working

**Check:**

1. Is `/api/search` endpoint implemented?
2. Check browser console for API errors
3. Verify query parameter is being sent

#### Issue: Filters not applying

**Check:**

1. Is `/api/reel/filter` endpoint implemented?
2. Check filter state in React DevTools
3. Verify filter parameters in network tab

#### Issue: Highlighting not working

**Check:**

1. Is `highlightQuery` prop passed to ReelCard?
2. Check if query is case-sensitive
3. Verify regex pattern in highlightText function

#### Issue: Debounce not working

**Check:**

1. Is useDebounce hook imported?
2. Verify delay is set (default 500ms)
3. Check if debouncedSearchQuery is used in API call

### Testing Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Check TypeScript errors
npx tsc --noEmit

# Check for console logs (remove in production)
grep -r "console.log" src/
```

### Performance Tips

1. **Debounce is crucial**: Don't remove it or search will be slow
2. **Cache results**: React Query handles this automatically
3. **Limit results**: Use pagination for large datasets
4. **Lazy load images**: Already implemented in ReelCard
5. **Memoize filters**: Use useMemo for expensive calculations

### Customization

#### Change debounce delay

```typescript
const debouncedSearchQuery = useDebounce(searchQuery, 1000); // 1 second
```

#### Change highlight color

```css
mark {
  background-color: #your-color;
}
```

#### Add more date range options

```typescript
const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
  { value: "90days", label: "Last 90 Days" }, // Add this
  { value: "custom", label: "Custom Range" },
];
```

#### Customize filter panel position

```typescript
// In FilterPanel.tsx
<div className="absolute right-0 top-full mt-2 w-80 ...">
// Change to:
<div className="absolute left-0 top-full mt-2 w-80 ...">
```

## Keyboard Shortcuts

- **Enter**: Submit search
- **Escape**: Close filter panel
- **Tab**: Navigate through filters
- **Space**: Toggle checkbox

## Mobile Behavior

- Search bar is full width
- Filter button is accessible
- Filter panel is scrollable
- Chips wrap to multiple lines
- Sidebar is hidden (hamburger menu)

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

## Next Steps

1. **Implement backend endpoints** (`/api/search` and `/api/reel/filter`)
2. **Test search functionality** with real data
3. **Test filter combinations** to ensure they work together
4. **Remove console.log statements** before production
5. **Add analytics** to track search behavior (optional)
6. **Optimize performance** if needed for large datasets
