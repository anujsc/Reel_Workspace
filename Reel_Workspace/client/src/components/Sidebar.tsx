import { cn } from "@/lib/utils";
import {
  FileText,
  FolderPlus,
  Inbox,
  ChevronDown,
  MoreVertical,
  Edit2,
  Trash2,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFolders } from "@/hooks/useFolders";
import { CreateFolderModal } from "@/components/modals/CreateFolderModal";
import { RenameFolderModal } from "@/components/modals/RenameFolderModal";
import { DeleteFolderDialog } from "@/components/modals/DeleteFolderDialog";
import { Folder } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface SidebarProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  totalReels: number;
  uncategorizedCount: number;
}

export function Sidebar({
  selectedFolderId,
  onSelectFolder,
  totalReels,
  uncategorizedCount,
}: SidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data: folders = [], isLoading, error } = useFolders();

  console.log("🎨 Sidebar - Folders:", folders);
  console.log("🎨 Sidebar - Loading:", isLoading);
  console.log("🎨 Sidebar - Error:", error);

  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  const handleRename = (folder: Folder) => {
    setSelectedFolder(folder);
    setIsRenameModalOpen(true);
  };

  const handleDelete = (folder: Folder) => {
    setSelectedFolder(folder);
    setIsDeleteDialogOpen(true);
  };

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  return (
    <>
      <aside className="w-60 h-screen flex flex-col fixed left-0 top-0 bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))]">
        {/* Logo */}
        <div className="p-5 border-b border-[hsl(var(--sidebar-border))]">
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            ReelMind
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Knowledge OS</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto p-3 space-y-0.5">
          {/* Library Section Header */}
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Library
            </p>
          </div>

          {/* All Knowledge */}
          <button
            onClick={() => onSelectFolder(null)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
              selectedFolderId === null
                ? "bg-secondary text-foreground font-medium shadow-sm"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            )}
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">All Knowledge</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
              {totalReels}
            </span>
          </button>

          {/* Inbox */}
          <button
            onClick={() => onSelectFolder("uncategorized")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
              selectedFolderId === "uncategorized"
                ? "bg-secondary text-foreground font-medium shadow-sm"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            )}
          >
            <Inbox className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">Inbox</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
              {uncategorizedCount}
            </span>
          </button>

          {/* Collections Section */}
          <div className="pt-5">
            <button
              onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
            >
              <ChevronDown
                className={cn(
                  "w-3 h-3 transition-transform",
                  !isFoldersExpanded && "-rotate-90"
                )}
              />
              Collections
            </button>

            {isFoldersExpanded && (
              <div className="mt-1 space-y-0.5">
                {isLoading ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Loading...
                  </div>
                ) : folders.length === 0 ? (
                  <div className="px-3 py-2.5 text-sm text-muted-foreground">
                    No collections yet
                  </div>
                ) : (
                  folders.map((folder) => (
                    <div
                      key={folder.id}
                      className={cn(
                        "group flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all",
                        selectedFolderId === folder.id
                          ? "bg-secondary text-foreground font-medium shadow-sm"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      )}
                    >
                      <button
                        onClick={() => onSelectFolder(folder.id)}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: folder.color }}
                        />
                        <span className="flex-1 text-left truncate">
                          {folder.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium flex-shrink-0">
                          {folder.reelCount}
                        </span>
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleRename(folder)}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(folder)}
                            className="text-destructive focus:text-destructive"
                            disabled={folder.isDefault}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                )}

                {/* Create New Collection Button */}
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all"
                >
                  <FolderPlus className="w-4 h-4 flex-shrink-0" />
                  <span>New Collection</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Footer - User Profile & Logout */}
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Modals */}
      <CreateFolderModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
      <RenameFolderModal
        open={isRenameModalOpen}
        onOpenChange={setIsRenameModalOpen}
        folder={selectedFolder}
      />
      <DeleteFolderDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        folder={selectedFolder}
      />
    </>
  );
}
