import { ExternalLink, Calendar, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const { mutate: updateReel, isPending } = useUpdateReel(reel.id);

  // Find the folder ID from the folder name
  const currentFolderId =
    folders?.find((f) => f.name === reel.folder)?.id || "";

  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const folderId = e.target.value || null;
    updateReel(
      { folderId: folderId as string },
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
    <div className="space-y-4">
      {/* Thumbnail */}
      <div className="aspect-[9/16] max-h-96 w-full rounded-lg overflow-hidden bg-muted">
        <img
          src={
            reel.thumbnail ||
            "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=711&fit=crop"
          }
          alt={reel.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Title */}
      <h1 className="text-xl font-bold text-foreground">{reel.title}</h1>

      {/* Creator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>By {creatorName}</span>
      </div>

      {/* Open in Instagram */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => window.open(reel.url, "_blank")}
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        Open in Instagram
      </Button>

      {/* Folder Selector */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium mb-2">
          <Folder className="w-4 h-4" />
          Folder
        </label>
        <select
          value={currentFolderId}
          onChange={handleFolderChange}
          disabled={isPending || foldersLoading}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">No Folder</option>
          {folders?.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date Added */}
      {reel.createdAt && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            Added{" "}
            {formatDistanceToNow(new Date(reel.createdAt), { addSuffix: true })}
          </span>
        </div>
      )}
    </div>
  );
}
