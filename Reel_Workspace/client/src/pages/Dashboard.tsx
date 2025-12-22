import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useReels } from "../hooks/useReels";
import { Folder } from "@/types/reel";
import { PasteLinkCard } from "@/components/PasteLinkCard";
import { ReelCard } from "@/components/ReelCard";
import { ReelCardSkeleton } from "@/components/ReelCardSkeleton";
import { Sidebar } from "@/components/Sidebar";
import { StudyMode } from "@/components/StudyMode";
import { Search, LogOut, Menu, X, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MOCK_FOLDERS: Folder[] = [
  { id: "f1", name: "Finance Tips", emoji: "💰", reelCount: 5 },
  { id: "f2", name: "Coding Tutorials", emoji: "💻", reelCount: 3 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Fetch reels from backend API
  const { data, isLoading, error, refetch } = useReels({ limit: 20, skip: 0 });

  const [folders, setFolders] = useState<Folder[]>(MOCK_FOLDERS);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedReelId, setSelectedReelId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const reels = data?.reels || [];
  const selectedReel = selectedReelId
    ? reels.find((r) => r.id === selectedReelId)
    : null;

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const handleCreateFolder = (name: string, emoji: string) => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      name,
      emoji,
      reelCount: 0,
    };
    setFolders((prev) => [...prev, newFolder]);
  };

  // Filter reels based on folder and search
  const filteredReels = reels.filter((reel) => {
    // Folder filter
    if (selectedFolderId === "uncategorized") {
      if (reel.folder) return false;
    } else if (selectedFolderId && selectedFolderId !== "uncategorized") {
      if (reel.folder !== selectedFolderId) return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        reel.title.toLowerCase().includes(query) ||
        reel.summary.toLowerCase().includes(query) ||
        reel.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // Study Mode View
  if (selectedReel) {
    return (
      <StudyMode
        reel={selectedReel}
        folders={folders}
        onBack={() => setSelectedReelId(null)}
        onUpdateReel={(updatedReel) => {
          // Refetch to get updated data
          refetch();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          folders={folders}
          reels={reels}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          onCreateFolder={handleCreateFolder}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-60 animate-slide-up">
            <Sidebar
              folders={folders}
              reels={reels}
              selectedFolderId={selectedFolderId}
              onSelectFolder={(id) => {
                setSelectedFolderId(id);
                setIsMobileSidebarOpen(false);
              }}
              onCreateFolder={handleCreateFolder}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-60">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 lg:px-6 py-3">
          <div className="flex items-center gap-4 max-w-5xl mx-auto">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Search */}
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reels..."
                className="pl-10"
              />
            </div>

            {/* Logout */}
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
          {/* Paste Link Card */}
          <PasteLinkCard />

          {/* Folder Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {selectedFolderId === null
                ? "All Reels"
                : selectedFolderId === "uncategorized"
                ? "Uncategorized"
                : folders.find((f) => f.id === selectedFolderId)?.name ||
                  "Folder"}
            </h2>
            <span className="text-sm text-muted-foreground">
              {filteredReels.length}{" "}
              {filteredReels.length === 1 ? "reel" : "reels"}
            </span>
          </div>

          {/* Reel Grid (Bento Style) */}
          {isLoading ? (
            // Loading state with skeleton loaders
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <ReelCardSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            // Error state
            <div className="calm-card text-center py-12">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Failed to load reels
              </h3>
              <p className="text-muted-foreground mb-4">
                {error instanceof Error
                  ? error.message
                  : "Something went wrong"}
              </p>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : filteredReels.length === 0 ? (
            // Empty state
            <div className="calm-card text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No reels found" : "No reels yet"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Paste a link above to get started!"}
              </p>
            </div>
          ) : (
            // Reels grid
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredReels.map((reel, index) => (
                <div
                  key={reel.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ReelCard reel={reel} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
