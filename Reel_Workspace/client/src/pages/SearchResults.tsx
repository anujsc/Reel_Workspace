import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSearch } from "@/hooks/useSearch";
import { ReelCard } from "@/components/ReelCard";
import { ReelCardSkeleton } from "@/components/ReelCardSkeleton";
import { SkeletonWrapper } from "@/components/SkeletonWrapper";
import { FilterPanel, FilterState } from "@/components/FilterPanel";
import { Sidebar } from "@/components/Sidebar";
import { StudyMode } from "@/components/StudyMode";
import { useFolders } from "@/hooks/useFolders";
import { useReels } from "@/hooks/useReels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, AlertCircle, ArrowLeft, Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function SearchResults() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [searchInput, setSearchInput] = useState(query);
  const [selectedReelId, setSelectedReelId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    tags: [],
    folders: [],
    dateRange: "all",
  });

  // Get all reels for counts
  const { data: allReelsData } = useReels({ limit: 1000, skip: 0 });
  const allReels = allReelsData?.reels || [];

  // Search with filters
  const searchFilters = useMemo(() => {
    const result: any = {};

    if (filters.tags.length > 0) {
      result.tags = filters.tags;
    }

    if (filters.folders.length > 0) {
      result.folders = filters.folders;
    }

    if (filters.dateRange !== "all") {
      const now = new Date();
      if (filters.dateRange === "7days") {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        result.dateRange = { start: start.toISOString() };
      } else if (filters.dateRange === "30days") {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        result.dateRange = { start: start.toISOString() };
      } else if (filters.dateRange === "custom" && filters.customDateRange) {
        result.dateRange = filters.customDateRange;
      }
    }

    return result;
  }, [filters]);

  const { data, isLoading, error } = useSearch({
    query,
    filters: searchFilters,
  });

  const { data: folders = [] } = useFolders();

  const reels = data?.reels || [];
  const selectedReel = selectedReelId
    ? reels.find((r) => r.id === selectedReelId)
    : null;

  // Extract unique tags from all reels
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    allReels.forEach((reel) => {
      reel.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [allReels]);

  // Calculate counts
  const totalReels = allReelsData?.total || 0;
  const uncategorizedCount = allReels.filter((r) => !r.folderId).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    navigate("/dashboard");
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      tags: [],
      folders: [],
      dateRange: "all",
    });
  };

  const handleRemoveTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleRemoveFolder = (folderId: string) => {
    setFilters((prev) => ({
      ...prev,
      folders: prev.folders.filter((f) => f !== folderId),
    }));
  };

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const activeFilterCount =
    filters.tags.length +
    filters.folders.length +
    (filters.dateRange !== "all" ? 1 : 0);

  // Highlight matching keywords in text
  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Study Mode View
  if (selectedReel) {
    return (
      <StudyMode
        reel={selectedReel}
        folders={folders}
        onBack={() => setSelectedReelId(null)}
        onUpdateReel={() => {}}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          selectedFolderId={null}
          onSelectFolder={(id) =>
            navigate(id ? `/dashboard?folder=${id}` : "/dashboard")
          }
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
              selectedFolderId={null}
              onSelectFolder={(id) => {
                navigate(id ? `/dashboard?folder=${id}` : "/dashboard");
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

            {/* Back button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search reels..."
                className="pl-10 pr-10"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Filter Panel */}
            <FilterPanel
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
              initialFilters={filters}
              availableTags={availableTags}
            />

            {/* Logout */}
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Search Results Content */}
        <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
          {/* Results Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {isLoading
                  ? "Searching..."
                  : `${data?.total || 0} results for "${query}"`}
              </h2>
            </div>

            {/* Active Filters */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.tags.map((tag) => (
                  <div
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                  >
                    <span>Tag: {tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {filters.folders.map((folderId) => {
                  const folder = folders.find((f) => f.id === folderId);
                  return folder ? (
                    <div
                      key={folderId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: folder.color }}
                      />
                      <span>{folder.name}</span>
                      <button
                        onClick={() => handleRemoveFolder(folderId)}
                        className="hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null;
                })}
                {filters.dateRange !== "all" && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
                    <span>
                      {filters.dateRange === "7days"
                        ? "Last 7 Days"
                        : filters.dateRange === "30days"
                        ? "Last 30 Days"
                        : "Custom Range"}
                    </span>
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, dateRange: "all" }))
                      }
                      className="hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results Grid */}
          <SkeletonWrapper
            isLoading={isLoading}
            skeleton={
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <ReelCardSkeleton key={index} />
                ))}
              </div>
            }
          >
            {error ? (
              <div className="calm-card text-center py-12">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Search failed</h3>
                <p className="text-muted-foreground">
                  {error instanceof Error
                    ? error.message
                    : "Something went wrong"}
                </p>
              </div>
            ) : reels.length === 0 ? (
              <div className="calm-card text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Search className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or filters
                </p>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {reels.map((reel, index) => (
                  <div
                    key={reel.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ReelCard reel={reel} highlightQuery={query} />
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
