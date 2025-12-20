import { useState } from "react";
import { Reel } from "@/types/reel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  reels: Reel[];
  onSelectReel: (reel: Reel) => void;
}

export function SearchSheet({ isOpen, onClose, reels, onSelectReel }: SearchSheetProps) {
  const [query, setQuery] = useState("");

  const filteredReels = reels.filter((reel) => {
    const searchLower = query.toLowerCase();
    return (
      reel.title.toLowerCase().includes(searchLower) ||
      reel.summary.toLowerCase().includes(searchLower) ||
      reel.transcript.toLowerCase().includes(searchLower) ||
      reel.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  });

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{part}</mark>
      ) : part
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Sheet */}
      <div className="absolute inset-x-0 bottom-0 top-16 glass rounded-t-3xl border-t border-border/50 flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-semibold text-foreground flex-1">Global Search</h2>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all reels..."
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto p-4 pb-24 space-y-3">
          {query && filteredReels.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No results found for "{query}"</p>
            </div>
          ) : (
            filteredReels.map((reel) => (
              <button
                key={reel.id}
                onClick={() => {
                  onSelectReel(reel);
                  onClose();
                }}
                className="bento-card w-full text-left hover:border-primary/50 transition-colors"
              >
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={reel.thumbnailUrl}
                      alt={reel.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground line-clamp-1">
                      {highlightMatch(reel.title, query)}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {highlightMatch(reel.summary.slice(0, 100), query)}...
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
