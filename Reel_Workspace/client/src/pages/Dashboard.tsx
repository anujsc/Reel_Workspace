import { useState } from "react";
import { Reel, Folder, ProcessingStep } from "@/types/reel";
import { PasteLinkCard } from "@/components/PasteLinkCard";
import { ReelCard } from "@/components/ReelCard";
import { Sidebar } from "@/components/Sidebar";
import { StudyMode } from "@/components/StudyMode";
import { Search, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Mock data for demonstration
const MOCK_REELS: Reel[] = [
  {
    id: '1',
    url: 'https://instagram.com/reel/abc123',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
    title: '5 Investment Strategies for 2024',
    summary: '• Dollar-cost averaging reduces timing risk\n• Index funds outperform 90% of active managers\n• Emergency fund should cover 6 months\n• Diversification across asset classes is key',
    transcript: 'Today I want to share five investment strategies that have changed my financial life. First, dollar-cost averaging - instead of trying to time the market, invest a fixed amount regularly...',
    ocrText: 'S&P 500 Returns: +26.3%\nBonds: +5.1%\nReal Estate: +8.7%',
    creatorHandle: 'financecoach',
    tags: ['finance', 'investing', 'money'],
    createdAt: new Date(),
    status: 'completed',
  },
  {
    id: '2',
    url: 'https://instagram.com/reel/def456',
    thumbnailUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop',
    title: 'React Hooks You Need to Know',
    summary: '• useState for component state\n• useEffect for side effects\n• useMemo for expensive calculations\n• useCallback for stable function references',
    transcript: 'Let me show you the four most important React hooks that every developer needs to master. Starting with useState, which lets you add state to functional components...',
    ocrText: 'const [count, setCount] = useState(0);\nuseEffect(() => { ... }, [deps]);',
    creatorHandle: 'codewithjohn',
    tags: ['coding', 'react', 'webdev'],
    createdAt: new Date(),
    status: 'completed',
  },
  {
    id: '3',
    url: 'https://instagram.com/reel/ghi789',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop',
    title: 'Morning Routine for Productivity',
    summary: '• Wake up at 5 AM consistently\n• 20 minutes of meditation\n• Cold shower for energy\n• Plan top 3 priorities before checking phone',
    transcript: 'Your morning sets the tone for your entire day. I wake up at 5 AM every single day, even on weekends. The first thing I do is meditate for 20 minutes...',
    ocrText: '',
    creatorHandle: 'productivityhub',
    tags: ['productivity', 'habits', 'morning'],
    createdAt: new Date(),
    status: 'completed',
  },
];

const MOCK_FOLDERS: Folder[] = [
  { id: 'f1', name: 'Finance Tips', emoji: '💰', reelCount: 5 },
  { id: 'f2', name: 'Coding Tutorials', emoji: '💻', reelCount: 3 },
];

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [reels, setReels] = useState<Reel[]>(MOCK_REELS);
  const [folders, setFolders] = useState<Folder[]>(MOCK_FOLDERS);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleExtract = async (url: string) => {
    // Simulate AI pipeline
    const steps: ProcessingStep[] = ['downloading', 'transcribing', 'summarizing', 'extracting'];
    
    for (const step of steps) {
      setProcessingStep(step);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // Add new mock reel
    const newReel: Reel = {
      id: Date.now().toString(),
      url,
      thumbnailUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop',
      title: 'Newly Extracted Reel',
      summary: '• Key insight from the reel\n• Another important point\n• Actionable takeaway',
      transcript: 'This is the transcribed content from the Instagram reel...',
      ocrText: 'Any text visible in the video frames',
      creatorHandle: 'creator',
      tags: ['new', 'learning'],
      createdAt: new Date(),
      status: 'completed',
    };

    setReels((prev) => [newReel, ...prev]);
    setProcessingStep('completed');
    setTimeout(() => setProcessingStep('idle'), 500);
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
      if (reel.folderId) return false;
    } else if (selectedFolderId && selectedFolderId !== "uncategorized") {
      if (reel.folderId !== selectedFolderId) return false;
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
        onBack={() => setSelectedReel(null)}
        onUpdateReel={(updatedReel) => {
          setReels((prev) =>
            prev.map((r) => (r.id === updatedReel.id ? updatedReel : r))
          );
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
            <Button variant="ghost" size="icon" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
          {/* Paste Link Card */}
          <PasteLinkCard onExtract={handleExtract} processingStep={processingStep} />

          {/* Folder Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {selectedFolderId === null
                ? "All Reels"
                : selectedFolderId === "uncategorized"
                ? "Uncategorized"
                : folders.find((f) => f.id === selectedFolderId)?.name || "Folder"}
            </h2>
            <span className="text-sm text-muted-foreground">
              {filteredReels.length} {filteredReels.length === 1 ? "reel" : "reels"}
            </span>
          </div>

          {/* Reel Grid (Bento Style) */}
          {filteredReels.length === 0 ? (
            <div className="calm-card text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No reels match your search."
                  : "No reels yet. Paste a link to get started!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredReels.map((reel, index) => (
                <div
                  key={reel.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ReelCard reel={reel} onClick={() => setSelectedReel(reel)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
