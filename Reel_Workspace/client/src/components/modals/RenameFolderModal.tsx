import { useState, useEffect } from "react";
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
import { useUpdateFolder } from "@/hooks/useFolders";
import { toast } from "sonner";
import { Folder } from "@/lib/types";

interface RenameFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: Folder | null;
}

export function RenameFolderModal({
  open,
  onOpenChange,
  folder,
}: RenameFolderModalProps) {
  const [name, setName] = useState("");
  const updateFolder = useUpdateFolder();

  useEffect(() => {
    if (folder) {
      setName(folder.name);
    }
  }, [folder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a folder name");
      return;
    }

    if (!folder) return;

    try {
      await updateFolder.mutateAsync({
        id: folder.id,
        data: { name: name.trim() },
      });

      toast.success("Folder renamed successfully");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to rename folder");
    }
  };

  const handleClose = () => {
    setName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Folder</DialogTitle>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateFolder.isPending}>
              {updateFolder.isPending ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
