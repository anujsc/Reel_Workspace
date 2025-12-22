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
import { useUpdateReel } from "@/hooks/useUpdateReel";
import { toast } from "sonner";
import { Reel } from "@/lib/types";

interface EditReelTitleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reel: Reel | null;
  onSuccess?: () => void;
}

export function EditReelTitleModal({
  open,
  onOpenChange,
  reel,
  onSuccess,
}: EditReelTitleModalProps) {
  const [title, setTitle] = useState("");
  const updateReel = useUpdateReel();

  useEffect(() => {
    if (reel) {
      setTitle(reel.title);
    }
  }, [reel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!reel) return;

    // Don't update if title hasn't changed
    if (title.trim() === reel.title) {
      onOpenChange(false);
      return;
    }

    try {
      await updateReel.mutateAsync({
        id: reel.id,
        data: { title: title.trim() },
      });

      toast.success("Title updated successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update title");
    }
  };

  const handleClose = () => {
    if (reel) {
      setTitle(reel.title); // Reset to original title
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Reel Title</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reel-title">Title</Label>
            <Input
              id="reel-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter reel title"
              autoFocus
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/200 characters
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateReel.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateReel.isPending}>
              {updateReel.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
