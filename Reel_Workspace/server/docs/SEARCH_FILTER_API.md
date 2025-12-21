# Search & Filter API Documentation

Complete guide for search and advanced filtering functionality.

---

## 🔍 Text Search API

### Endpoint

```
GET /api/search
```

### Description

Performs full-text search across reel content including:

- Title
- Summary
- Transcript
- OCR Text
- Detailed Explanation

Results are ranked by relevance score using MongoDB's text search.

### Authentication

Required - Bearer token

### Query Parameters

| Parameter | Type   | Required | Default | Description                         |
| --------- | ------ | -------- | ------- | ----------------------------------- |
| `q`       | string | Yes      | -       | Search query (min 2 chars, max 200) |
| `limit`   | number | No       | 20      | Results per page (1-100)            |
| `skip`    | number | No       | 0       | Number of results to skip           |

### Request Example

```bash
GET /api/search?q=technology&limit=10&skip=0
```

### Response Format

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "507f1f77bcf86cd799439011",
        "title": "AI Technology Tutorial",
        "summary": "Learn about modern technology...",
        "thumbnailUrl": "https://...",
        "tags": ["technology", "ai", "tutorial"],
        "folderId": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Technology",
          "color": "#3B82F6"
        },
        "createdAt": "2024-12-21T10:00:00.000Z",
        "score": 2.5
      }
    ],
    "pagination": {
      "total": 15,
      "limit": 10,
      "skip": 0,
      "hasMore": true
    },
    "query": "technology"
  },
  "message": "Search completed successfully"
}
```

### Response Fields

- `results` - Array of matching reels
  - `id` - Reel ID
  - `title` - Reel title
  - `summary` - Brief summary
  - `thumbnailUrl` - Thumbnail image URL
  - `tags` - Array of tags
  - `folderId` - Folder information
  - `createdAt` - Creation timestamp
  - `score` - Relevance score (higher = more relevant)
- `pagination` - Pagination information
  - `total` - Total matching results
  - `limit` - Results per page
  - `skip` - Results skipped
  - `hasMore` - More results available
- `query` - Original search query

### Search Behavior

1. **Case Insensitive** - Searches are case-insensitive
2. **Partial Matching** - Matches partial words
3. **Relevance Ranking** - Results sorted by relevance score
4. **Multi-field** - Searches across multiple fields simultaneously
5. **User Isolation** - Only searches user's own reels

### Examples

#### Search for "AI"

```bash
curl "http://localhost:5000/api/search?q=ai" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Search with Pagination

```bash
curl "http://localhost:5000/api/search?q=tutorial&limit=5&skip=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Search Multi-word Query

```bash
curl "http://localhost:5000/api/search?q=machine%20learning" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Error Responses

#### Missing Query

```json
{
  "success": false,
  "message": "Search query is required",
  "errors": [
    {
      "field": "q",
      "message": "Query parameter cannot be empty"
    }
  ]
}
```

#### Query Too Short

```json
{
  "success": false,
  "message": "Search query must be at least 2 characters",
  "errors": [
    {
      "field": "q",
      "message": "Minimum 2 characters required"
    }
  ]
}
```

---

## 🎯 Advanced Filter API

### Endpoint

```
GET /api/reel/filter
```

### Description

Advanced filtering with multiple criteria:

- Filter by folder
- Filter by tags (multiple)
- Filter by date range
- Combine multiple filters

### Authentication

Required - Bearer token

### Query Parameters

| Parameter  | Type   | Required | Default | Description                         |
| ---------- | ------ | -------- | ------- | ----------------------------------- |
| `folderId` | string | No\*     | -       | Filter by folder ID (ObjectId)      |
| `tags`     | string | No\*     | -       | Comma-separated tags                |
| `dateFrom` | string | No\*     | -       | Start date (ISO format: YYYY-MM-DD) |
| `dateTo`   | string | No\*     | -       | End date (ISO format: YYYY-MM-DD)   |
| `limit`    | number | No       | 20      | Results per page (1-100)            |
| `skip`     | number | No       | 0       | Number of results to skip           |

\*At least one filter parameter is required

### Request Examples

#### Filter by Folder

```bash
GET /api/reel/filter?folderId=507f1f77bcf86cd799439011
```

#### Filter by Tags

```bash
GET /api/reel/filter?tags=technology,ai,tutorial
```

#### Filter by Date Range

```bash
GET /api/reel/filter?dateFrom=2024-01-01&dateTo=2024-12-31
```

#### Combine Multiple Filters

```bash
GET /api/reel/filter?folderId=507f1f77bcf86cd799439011&tags=ai&dateFrom=2024-06-01
```

### Response Format

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "507f1f77bcf86cd799439011",
        "title": "AI Tutorial",
        "summary": "Learn about AI...",
        "thumbnailUrl": "https://...",
        "tags": ["ai", "technology"],
        "folderId": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Technology",
          "color": "#3B82F6"
        },
        "createdAt": "2024-12-21T10:00:00.000Z",
        "durationSeconds": 120
      }
    ],
    "pagination": {
      "total": 8,
      "limit": 20,
      "skip": 0,
      "hasMore": false
    },
    "filters": {
      "folderId": "507f1f77bcf86cd799439011",
      "tags": ["technology", "ai"],
      "dateFrom": "2024-01-01",
      "dateTo": "2024-12-31"
    },
    "counts": {
      "total": 50,
      "filtered": 8
    }
  },
  "message": "Filter applied successfully"
}
```

### Response Fields

- `results` - Array of filtered reels
- `pagination` - Pagination information
- `filters` - Applied filters (echo back)
- `counts` - Result counts
  - `total` - Total reels (unfiltered)
  - `filtered` - Matching reels after filters

### Filter Behavior

1. **AND Logic** - All filters are combined with AND
2. **Tag Matching** - Matches ANY of the provided tags (OR within tags)
3. **Date Inclusive** - Includes both start and end dates
4. **User Isolation** - Only filters user's own reels
5. **Soft Delete** - Excludes deleted reels

### Examples

#### Filter Technology Reels from Last Month

```bash
curl "http://localhost:5000/api/reel/filter?folderId=abc123&dateFrom=2024-11-01&dateTo=2024-11-30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Filter by Multiple Tags

```bash
curl "http://localhost:5000/api/reel/filter?tags=ai,machine-learning,tutorial" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Filter Recent Reels (Last 7 Days)

```bash
curl "http://localhost:5000/api/reel/filter?dateFrom=2024-12-14&dateTo=2024-12-21" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Error Responses

#### No Filters Provided

```json
{
  "success": false,
  "message": "At least one filter parameter must be provided",
  "errors": [
    {
      "message": "Provide at least one of: folderId, tags, dateFrom, dateTo"
    }
  ]
}
```

#### Invalid Date Format

```json
{
  "success": false,
  "message": "Invalid dateFrom format",
  "errors": [
    {
      "field": "dateFrom",
      "message": "Must be a valid ISO date (YYYY-MM-DD)"
    }
  ]
}
```

#### Date Range Invalid

```json
{
  "success": false,
  "message": "dateFrom must be before dateTo",
  "errors": [
    {
      "field": "dateFrom",
      "message": "Must be before dateTo"
    }
  ]
}
```

---

## 📊 Filter Statistics API

### Endpoint

```
GET /api/reel/filter/stats
```

### Description

Get statistics for building filter UI:

- Available tags with counts
- Date range (oldest to newest reel)
- Folder distribution

### Authentication

Required - Bearer token

### Request Example

```bash
GET /api/reel/filter/stats
```

### Response Format

```json
{
  "success": true,
  "data": {
    "tags": [
      { "tag": "technology", "count": 15 },
      { "tag": "ai", "count": 12 },
      { "tag": "tutorial", "count": 10 }
    ],
    "dateRange": {
      "oldest": "2024-01-15T10:00:00.000Z",
      "newest": "2024-12-21T10:00:00.000Z"
    },
    "folders": [
      {
        "folderId": "507f1f77bcf86cd799439011",
        "folderName": "Technology",
        "folderColor": "#3B82F6",
        "count": 20
      },
      {
        "folderId": "507f1f77bcf86cd799439012",
        "folderName": "Education",
        "folderColor": "#10B981",
        "count": 15
      }
    ]
  },
  "message": "Filter statistics retrieved successfully"
}
```

### Use Cases

1. **Tag Cloud** - Display popular tags with counts
2. **Date Picker** - Set min/max dates based on user's reels
3. **Folder Selector** - Show folders with reel counts
4. **Filter UI** - Build dynamic filter interface

---

## 🎨 UI Integration Examples

### Search Bar Component

```javascript
const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (query.length < 2) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setResults(data.data.results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        placeholder="Search reels..."
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? "Searching..." : "Search"}
      </button>

      {results.map((reel) => (
        <ReelCard key={reel.id} reel={reel} score={reel.score} />
      ))}
    </div>
  );
};
```

### Advanced Filter Component

```javascript
const AdvancedFilter = () => {
  const [filters, setFilters] = useState({
    folderId: "",
    tags: [],
    dateFrom: "",
    dateTo: "",
  });
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);

  // Load filter stats on mount
  useEffect(() => {
    loadFilterStats();
  }, []);

  const loadFilterStats = async () => {
    const response = await fetch("/api/reel/filter/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setStats(data.data);
  };

  const applyFilters = async () => {
    const params = new URLSearchParams();
    if (filters.folderId) params.append("folderId", filters.folderId);
    if (filters.tags.length) params.append("tags", filters.tags.join(","));
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.append("dateTo", filters.dateTo);

    const response = await fetch(`/api/reel/filter?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setResults(data.data.results);
  };

  return (
    <div>
      {/* Folder Filter */}
      <select
        value={filters.folderId}
        onChange={(e) => setFilters({ ...filters, folderId: e.target.value })}
      >
        <option value="">All Folders</option>
        {stats?.folders.map((folder) => (
          <option key={folder.folderId} value={folder.folderId}>
            {folder.folderName} ({folder.count})
          </option>
        ))}
      </select>

      {/* Tag Filter */}
      <div>
        {stats?.tags.slice(0, 10).map((tag) => (
          <label key={tag.tag}>
            <input
              type="checkbox"
              checked={filters.tags.includes(tag.tag)}
              onChange={(e) => {
                const newTags = e.target.checked
                  ? [...filters.tags, tag.tag]
                  : filters.tags.filter((t) => t !== tag.tag);
                setFilters({ ...filters, tags: newTags });
              }}
            />
            {tag.tag} ({tag.count})
          </label>
        ))}
      </div>

      {/* Date Range Filter */}
      <div>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          min={stats?.dateRange?.oldest?.split("T")[0]}
          max={stats?.dateRange?.newest?.split("T")[0]}
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          min={filters.dateFrom || stats?.dateRange?.oldest?.split("T")[0]}
          max={stats?.dateRange?.newest?.split("T")[0]}
        />
      </div>

      <button onClick={applyFilters}>Apply Filters</button>

      {/* Results */}
      <div>
        {results.map((reel) => (
          <ReelCard key={reel.id} reel={reel} />
        ))}
      </div>
    </div>
  );
};
```

---

## 🚀 Performance Optimization

### Indexes Created

```javascript
// Text search index
reelSchema.index({
  title: "text",
  summary: "text",
  transcript: "text",
  ocrText: "text",
  detailedExplanation: "text",
});

// Compound indexes for filtering
reelSchema.index({ userId: 1, createdAt: -1 });
reelSchema.index({ userId: 1, folderId: 1 });
reelSchema.index({ userId: 1, isDeleted: 1 });
reelSchema.index({ tags: 1 });
```

### Query Optimization

1. **Text Search** - Uses MongoDB's built-in text index
2. **Relevance Scoring** - Sorts by textScore for best matches
3. **Compound Filters** - Uses $and for efficient multi-criteria filtering
4. **Lean Queries** - Returns plain objects for better performance
5. **Selective Fields** - Only fetches required fields

### Best Practices

1. **Pagination** - Always use limit/skip for large result sets
2. **Debounce Search** - Wait 300ms before searching
3. **Cache Stats** - Cache filter statistics for 5 minutes
4. **Index Coverage** - All queries use indexes
5. **User Isolation** - Always filter by userId first

---

## 📝 Testing Checklist

### Search Tests

- [ ] Search with single word
- [ ] Search with multiple words
- [ ] Search with special characters
- [ ] Search returns ranked results
- [ ] Search pagination works
- [ ] Search with no results
- [ ] Search with invalid query (too short)
- [ ] Search across all fields (title, summary, transcript, OCR)

### Filter Tests

- [ ] Filter by folder only
- [ ] Filter by single tag
- [ ] Filter by multiple tags
- [ ] Filter by date range
- [ ] Filter with all criteria combined
- [ ] Filter with no results
- [ ] Filter with invalid folder ID
- [ ] Filter with invalid date format
- [ ] Filter with dateFrom > dateTo

### Stats Tests

- [ ] Get filter statistics
- [ ] Verify tag counts
- [ ] Verify date range
- [ ] Verify folder counts

---

## 🎯 Quick Reference

### Search

```bash
GET /api/search?q=keyword&limit=20&skip=0
```

### Filter by Folder

```bash
GET /api/reel/filter?folderId=abc123
```

### Filter by Tags

```bash
GET /api/reel/filter?tags=tag1,tag2,tag3
```

### Filter by Date

```bash
GET /api/reel/filter?dateFrom=2024-01-01&dateTo=2024-12-31
```

### Get Stats

```bash
GET /api/reel/filter/stats
```

---

## 🔐 Security

- ✅ All endpoints require authentication
- ✅ User isolation enforced
- ✅ Input validation on all parameters
- ✅ SQL injection protected (MongoDB)
- ✅ Rate limiting recommended (future)

---

Last Updated: December 21, 2024
