import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useReels } from "../hooks/useReels";
import { useDebounce } from "../hooks/useDebounce";
import { PasteLinkCard } from "@/components/PasteLinkCard";
import { ReelCard } from "@/components/ReelCard";
import { ReelCardSkeleton } from "@/components/ReelCardSkeleton";
import { SkeletonWrapper } from "@/components/SkeletonWrapper";
import { Sidebar } from "@/components/Sidebar";
import { StudyMode } from "@/components/StudyMode";
import { InlineLoader } from "@/components/Loader";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import {
  Search,
  LogOut,
  Menu,
  X,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFolders } from "@/hooks/useFolders";

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get folder from URL params
  const folderParam = searchParams.get("folder");
  const selectedFolderId = folderParam || null;

  console.log("📊 Dashboard - Selected Folder ID:", selectedFolderId);

  // Fetch reels from backend API with folder filter
  const { data, isLoading, error, refetch } = useReels({
    limit: 20,
    skip: 0,
    folder: folderParam || undefined,
  });

  const { data: folders = [] } = useFolders();

  const [selectedReelId, setSelectedReelId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const reels = data?.reels || [];
  const selectedReel = selectedReelId
    ? reels.find((r) => r.id === selectedReelId)
    : null;

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const handleSelectFolder = (folderId: string | null) => {
    if (folderId === null) {
      setSearchParams({});
    } else {
      setSearchParams({ folder: folderId });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsSearching(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Reset searching state when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      setIsSearching(false);
    }
  }, [debouncedSearchQuery, searchQuery]);

  // Calculate counts
  const totalReels = data?.total || 0;
  const uncategorizedCount = reels.filter((r) => !r.folder).length;

  // Filter reels based on search
  const filteredReels = reels.filter((reel) => {
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
          selectedFolderId={selectedFolderId}
          onSelectFolder={handleSelectFolder}
          totalReels={totalReels}
          uncategorizedCount={uncategorizedCount}
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
              selectedFolderId={selectedFolderId}
              onSelectFolder={(id) => {
                handleSelectFolder(id);
                setIsMobileSidebarOpen(false);
              }}
              totalReels={totalReels}
              uncategorizedCount={uncategorizedCount}
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
        {/* Mobile Header - Only visible on mobile */}
        <header className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center h-[57px] px-4 gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <img src="/instagram-logo.png" alt="ReelMind" className="w-6 h-6" />
            <h1 className="text-base font-semibold">ReelMind</h1>
            <div className="ml-auto">
              <DarkModeToggle variant="ghost" size="icon" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
          {/* Hero Section - Search + Add Knowledge */}
          <div className="space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search by topic, tag, or insight..."
                className="pl-12 pr-16 h-12 text-base bg-background border-border shadow-sm focus:shadow-md transition-all"
              />
              <kbd className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-muted-foreground bg-muted border border-border rounded">
                ⏎
              </kbd>
              {isSearching && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                  <InlineLoader />
                </div>
              )}
            </form>

            {/* Add Knowledge Card */}
            <PasteLinkCard />
          </div>

          {/* Section Header */}
          <div className="flex items-baseline justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {selectedFolderId === null
                  ? "All Knowledge"
                  : selectedFolderId === "uncategorized"
                  ? "Inbox"
                  : folders.find((f) => f.id === selectedFolderId)?.name ||
                    "Collection"}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {filteredReels.length}{" "}
                {filteredReels.length === 1 ? "item" : "items"}
              </p>
            </div>
          </div>

          {/* Knowledge Grid */}
          <SkeletonWrapper
            isLoading={isLoading}
            skeleton={
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <ReelCardSkeleton key={index} />
                ))}
              </div>
            }
          >
            {error ? (
              // Error state
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
                <h3 className="text-base font-semibold mb-1.5">
                  Failed to load knowledge
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {error instanceof Error
                    ? error.message
                    : "Something went wrong"}
                </p>
                <Button onClick={() => refetch()} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : filteredReels.length === 0 ? (
              // Empty state
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-semibold mb-1.5">
                  {searchQuery ? "No results found" : "No knowledge yet"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {searchQuery
                    ? "Try adjusting your search terms or filters"
                    : "Start building your knowledge library by adding your first Reel above"}
                </p>
              </div>
            ) : (
              // Knowledge list (vertical cards)
              <div className="space-y-3">
                {filteredReels.map((reel, index) => (
                  <div
                    key={reel.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <ReelCard reel={reel} highlightQuery={searchQuery} />
                  </div>
                ))}
              </div>
            )}
          </SkeletonWrapper>
        </div>
      </main>
    </div>
  );
}
