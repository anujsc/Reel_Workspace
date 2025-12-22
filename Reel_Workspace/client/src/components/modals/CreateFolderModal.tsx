import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateFolder } from "@/hooks/useFolders";
import { toast } from "sonner";

interface CreateFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
];

export function CreateFolderModal({
  open,
  onOpenChange,
}: CreateFolderModalProps) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const createFolder = useCreateFolder();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a folder name");
      return;
    }

    try {
      await createFolder.mutateAsync({
        name: name.trim(),
        color: selectedColor,
      });

      toast.success("Folder created successfully");
      setName("");
      setSelectedColor(COLORS[0]);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create folder");
    }
  };

  const handleClose = () => {
    setName("");
    setSelectedColor(COLORS[0]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Finance Tips"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-8 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor:
                      selectedColor === color ? color : "transparent",
                    boxShadow:
                      selectedColor === color
                        ? `0 0 0 2px white, 0 0 0 4px ${color}`
                        : "none",
                  }}
                  aria-label={`Select ${color}`}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createFolder.isPending}>
              {createFolder.isPending ? "Creating..." : "Create Folder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
