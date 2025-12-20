import { useState } from "react";
import { Folder, Reel } from "@/types/reel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderOpen, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FoldersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  reels: Reel[];
  onCreateFolder: (name: string, emoji: string) => void;
  onSelectFolder: (folderId: string | null) => void;
  selectedFolderId: string | null;
}

const EMOJIS = ['📚', '💡', '🎯', '💰', '🏋️', '🍳', '💻', '🎨', '🎵', '✈️'];

export function FoldersSheet({
  isOpen,
  onClose,
  folders,
  reels,
  onCreateFolder,
  onSelectFolder,
  selectedFolderId,
}: FoldersSheetProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);

  const handleCreate = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), selectedEmoji);
      setNewFolderName("");
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute inset-x-0 bottom-0 max-h-[70vh] glass rounded-t-3xl border-t border-border/50 flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b border-border/50 flex items-center gap-3">
          <FolderOpen className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground flex-1">Folders</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 pb-24 space-y-2">
          {/* All Reels */}
          <button
            onClick={() => {
              onSelectFolder(null);
              onClose();
            }}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl transition-colors",
              selectedFolderId === null
                ? "bg-primary/20 text-foreground"
                : "hover:bg-secondary text-muted-foreground"
            )}
          >
            <span className="text-xl">📥</span>
            <span className="flex-1 text-left font-medium">All Reels</span>
            <span className="text-sm">{reels.length}</span>
          </button>

          {/* Folders */}
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => {
                onSelectFolder(folder.id);
                onClose();
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-colors",
                selectedFolderId === folder.id
                  ? "bg-primary/20 text-foreground"
                  : "hover:bg-secondary text-muted-foreground"
              )}
            >
              <span className="text-xl">{folder.emoji}</span>
              <span className="flex-1 text-left font-medium">{folder.name}</span>
              <span className="text-sm">{folder.reelCount}</span>
            </button>
          ))}

          {/* Create New */}
          {isCreating ? (
            <div className="bento-card space-y-3">
              <div className="flex gap-2 flex-wrap">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors",
                      selectedEmoji === emoji ? "bg-primary/20" : "bg-secondary hover:bg-muted"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                autoFocus
              />
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleCreate}>
                  Create
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">New Folder</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
