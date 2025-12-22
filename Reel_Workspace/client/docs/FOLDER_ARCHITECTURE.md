# Folder Management Architecture

## Component Hierarchy

```
Dashboard
├── Sidebar
│   ├── Logo Section
│   ├── Navigation
│   │   ├── All Reels Button
│   │   ├── Uncategorized Button
│   │   └── Folders Section
│   │       ├── Folder List
│   │       │   └── Folder Item
│   │       │       ├── Color Dot
│   │       │       ├── Name
│   │       │       ├── Count Badge
│   │       │       └── DropdownMenu
│   │       │           ├── Rename Action
│   │       │           └── Delete Action
│   │       └── New Folder Button
│   └── Footer (Sign Out)
├── Header (Search + Mobile Menu)
├── PasteLinkCard
└── Reel Grid

Modals (Portal)
├── CreateFolderModal
├── RenameFolderModal
└── DeleteFolderDialog
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         Dashboard                            │
│                                                              │
│  ┌────────────────┐                  ┌──────────────────┐  │
│  │   Sidebar      │                  │   Main Content   │  │
│  │                │                  │                  │  │
│  │  useFolders()  │◄─────────────────┤  useReels()      │  │
│  │  ↓             │                  │  ↓               │  │
│  │  folders[]     │                  │  reels[]         │  │
│  │                │                  │                  │  │
│  │  onClick       │──────────────────►│  filter by      │  │
│  │  folder        │  setSearchParams │  folder param   │  │
│  └────────────────┘                  └──────────────────┘  │
│         │                                                   │
│         │ Opens Modal                                       │
│         ▼                                                   │
│  ┌────────────────┐                                        │
│  │  Folder Modal  │                                        │
│  │                │                                        │
│  │  Mutation      │                                        │
│  │  ↓             │                                        │
│  │  API Call      │                                        │
│  │  ↓             │                                        │
│  │  Invalidate    │                                        │
│  │  Queries       │                                        │
│  └────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

## State Management

### React Query Cache

```
queries:
  - ["folders"] → Folder[]
  - ["reels", limit, skip, folder] → { reels: Reel[], total: number }

mutations:
  - createFolder → POST /api/folders
  - updateFolder → PATCH /api/folders/:id
  - deleteFolder → DELETE /api/folders/:id
```

### URL State

```
/dashboard                          → All reels
/dashboard?folder=uncategorized     → Uncategorized reels
/dashboard?folder=<folder-id>       → Specific folder reels
```

### Local Component State

```
Dashboard:
  - selectedReelId: string | null
  - searchQuery: string
  - isMobileSidebarOpen: boolean

Sidebar:
  - isFoldersExpanded: boolean
  - isCreateModalOpen: boolean
  - isRenameModalOpen: boolean
  - isDeleteDialogOpen: boolean
  - selectedFolder: Folder | null
```

## API Integration

### Endpoints

```typescript
GET    /api/folders              → Folder[]
POST   /api/folders              → Folder
PATCH  /api/folders/:id          → Folder
DELETE /api/folders/:id          → { success: boolean }
GET    /api/reel?folder=<id>     → { data: Reel[], meta: { total } }
```

### Request/Response Flow

```
1. User Action (e.g., Create Folder)
   ↓
2. Mutation Hook (useCreateFolder)
   ↓
3. API Call (POST /api/folders)
   ↓
4. Response Received
   ↓
5. Query Invalidation (["folders"])
   ↓
6. Automatic Refetch
   ↓
7. UI Update
   ↓
8. Toast Notification
```

## Folder Operations

### Create Folder

```typescript
Input:  { name: string, color: string }
API:    POST /api/folders
Result: New folder in sidebar
Side:   Invalidates ["folders"] query
```

### Rename Folder

```typescript
Input:  { id: string, data: { name: string } }
API:    PATCH /api/folders/:id
Result: Updated folder name
Side:   Invalidates ["folders"] query
```

### Delete Folder

```typescript
Input:  id: string
API:    DELETE /api/folders/:id
Result: Folder removed, reels moved to uncategorized
Side:   Invalidates ["folders"] and ["reels"] queries
Guard:  Cannot delete if isDefault === true
```

### Filter by Folder

```typescript
Input:  folderId: string | null
Action: setSearchParams({ folder: folderId })
Result: URL updates, useReels refetches with folder param
Side:   Dashboard shows filtered reels
```

## Type Definitions

### Folder Type

```typescript
interface Folder {
  id: string;
  name: string;
  color: string; // Hex color code
  reelCount: number; // Number of reels in folder
  isDefault?: boolean; // Cannot be deleted if true
  createdAt?: string;
  updatedAt?: string;
}
```

### Hook Return Types

```typescript
useFolders() → {
  data: Folder[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

useCreateFolder() → {
  mutate: (data: { name: string; color?: string }) => void;
  mutateAsync: (data: { name: string; color?: string }) => Promise<any>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
}
```

## UI Components Used

### Radix UI Primitives

- `@radix-ui/react-dialog` → CreateFolderModal, RenameFolderModal
- `@radix-ui/react-alert-dialog` → DeleteFolderDialog
- `@radix-ui/react-dropdown-menu` → Folder actions menu
- `@radix-ui/react-label` → Form labels

### Custom Components

- `Button` → All interactive buttons
- `Input` → Text input fields
- `toast` (sonner) → Notifications

## Styling Approach

### Tailwind Classes

- Layout: `flex`, `grid`, `space-y-*`
- Colors: `bg-*`, `text-*`, `border-*`
- States: `hover:*`, `focus:*`, `active:*`
- Responsive: `lg:*`, `md:*`, `sm:*`
- Animations: `transition-*`, `animate-*`

### Dynamic Styles

```typescript
// Folder color indicator
<div style={{ backgroundColor: folder.color }} />

// Active folder highlighting
className={cn(
  "base-classes",
  selectedFolderId === folder.id && "active-classes"
)}
```

## Error Handling

### Mutation Errors

```typescript
try {
  await mutation.mutateAsync(data);
  toast.success("Success message");
} catch (error: any) {
  toast.error(error.response?.data?.message || "Fallback message");
}
```

### Query Errors

```typescript
if (error) {
  return <ErrorState error={error} onRetry={refetch} />;
}
```

### Validation

- Empty folder name → Show error toast
- Default folder deletion → Disable delete option
- Network errors → Show error toast with message

## Performance Optimizations

1. **Query Caching**: React Query caches folder and reel data
2. **Selective Invalidation**: Only invalidate affected queries
3. **Optimistic Updates**: Could be added for instant UI feedback
4. **Lazy Loading**: Folders loaded once, reused across navigation
5. **Memoization**: Could add useMemo for filtered reels

## Future Enhancements

1. **Drag & Drop**: Move reels between folders
2. **Bulk Operations**: Select multiple folders/reels
3. **Folder Nesting**: Subfolders support
4. **Folder Sharing**: Collaborate with other users
5. **Custom Icons**: Replace color dots with icons
6. **Folder Templates**: Pre-configured folder sets
7. **Smart Folders**: Auto-categorize based on rules
8. **Folder Analytics**: Track usage and insights
