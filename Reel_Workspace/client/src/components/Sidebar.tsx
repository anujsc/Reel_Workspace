import { Folder, Reel } from "@/types/reel";
import { cn } from "@/lib/utils";
import { FileText, FolderPlus, Inbox, Archive, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  folders: Folder[];
  reels: Reel[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string, emoji: string) => void;
}

export function Sidebar({
  folders,
  reels,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
}: SidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);

  const uncategorizedCount = reels.filter(r => !r.folderId).length;

  const handleCreate = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), "📁");
      setNewFolderName("");
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreate();
    } else if (e.key === "Escape") {
      setIsCreating(false);
      setNewFolderName("");
    }
  };

  return (
    <aside className="w-60 h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground">ReelMind</h1>
        <p className="text-xs text-muted-foreground">Knowledge Workspace</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto p-2 space-y-1">
        {/* All Reels */}
        <button
          onClick={() => onSelectFolder(null)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
            selectedFolderId === null
              ? "bg-secondary text-foreground font-medium"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <FileText className="w-4 h-4" />
          <span className="flex-1 text-left">All Reels</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {reels.length}
          </span>
        </button>

        {/* Uncategorized */}
        <button
          onClick={() => onSelectFolder("uncategorized")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
            selectedFolderId === "uncategorized"
              ? "bg-secondary text-foreground font-medium"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <Inbox className="w-4 h-4" />
          <span className="flex-1 text-left">Uncategorized</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {uncategorizedCount}
          </span>
        </button>

        {/* Folders Section */}
        <div className="pt-4">
          <button
            onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={cn(
                "w-3 h-3 transition-transform",
                !isFoldersExpanded && "-rotate-90"
              )}
            />
            Folders
          </button>

          {isFoldersExpanded && (
            <div className="mt-1 space-y-1">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => onSelectFolder(folder.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    selectedFolderId === folder.id
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Archive className="w-4 h-4" />
                  <span className="flex-1 text-left truncate">{folder.name}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {folder.reelCount}
                  </span>
                </button>
              ))}

              {/* Create New Folder */}
              {isCreating ? (
                <div className="px-3 py-2">
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Folder name..."
                    className="h-8 text-sm"
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>New Folder</span>
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Research Tool
        </p>
      </div>
    </aside>
  );
}
