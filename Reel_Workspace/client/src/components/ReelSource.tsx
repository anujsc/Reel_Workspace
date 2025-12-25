import {
  ExternalLink,
  Calendar,
  Folder,
  ChevronDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Reel } from "../lib/types";
import { formatDistanceToNow } from "date-fns";
import { useFolders } from "../hooks/useFolders";
import { useUpdateReel } from "../hooks/useUpdateReel";
import { toast } from "sonner";

interface ReelSourceProps {
  reel: Reel;
}

export function ReelSource({ reel }: ReelSourceProps) {
  const creatorName = reel.metadata?.creator || "Unknown Creator";
  const { data: folders, isLoading: foldersLoading } = useFolders();
  const { mutate: updateReel, isPending } = useUpdateReel();

  // Find the folder ID from the folder name
  const currentFolderId =
    folders?.find((f) => f.name === reel.folder)?.id || "no-folder";

  const handleFolderChange = (folderId: string) => {
    const actualFolderId = folderId === "no-folder" ? null : folderId;
    updateReel(
      {
        id: reel.id,
        data: { folderId: actualFolderId },
      },
      {
        onSuccess: () => {
          toast.success("Folder updated successfully!");
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message || "Failed to update folder"
          );
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)] overflow-hidden">
      {/* Thumbnail - Optimized Size */}
      <div className="aspect-[9/16] max-h-[280px] w-full rounded-2xl overflow-hidden bg-muted shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-border/50 flex-shrink-0">
        <img
          src={
            reel.thumbnail ||
            "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=711&fit=crop"
          }
          alt={reel.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto hide-scrollbar mt-4 space-y-4 pr-1">
        {/* Title with Better Typography */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground leading-tight tracking-tight line-clamp-3">
            {reel.title}
          </h1>

          {/* Creator */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">
                {creatorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-muted-foreground truncate">
              By {creatorName}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/60" />

        {/* Open in Instagram - Compact Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full h-10 font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-200 border-border/60 shadow-sm"
          onClick={() => window.open(reel.url, "_blank")}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in Instagram
        </Button>

        {/* Folder Selector - Enhanced Dropdown */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Folder className="w-4 h-4 text-primary" />
            Folder
          </label>
          <Select
            value={currentFolderId}
            onValueChange={handleFolderChange}
            disabled={isPending || foldersLoading}
          >
            <SelectTrigger className="w-full h-10 border-border/60 rounded-xl bg-background hover:bg-muted/50 transition-colors focus:ring-2 focus:ring-primary/50">
              <SelectValue placeholder="No Folder" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/60">
              <SelectItem value="no-folder" className="rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted" />
                  <span>No Folder</span>
                </div>
              </SelectItem>
              {folders?.map((folder) => (
                <SelectItem
                  key={folder.id}
                  value={folder.id}
                  className="rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: folder.color || "#888" }}
                    />
                    <span>{folder.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Added - Compact */}
        {reel.createdAt && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border/40">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground font-medium">
              Added{" "}
              {formatDistanceToNow(new Date(reel.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
