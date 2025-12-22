import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteReel } from "@/hooks/useDeleteReel";
import { toast } from "sonner";
import { Reel } from "@/lib/types";

interface DeleteReelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reel: Reel | null;
  onSuccess?: () => void;
}

export function DeleteReelDialog({
  open,
  onOpenChange,
  reel,
  onSuccess,
}: DeleteReelDialogProps) {
  const deleteReel = useDeleteReel();

  const handleDelete = async () => {
    if (!reel) return;

    try {
      await deleteReel.mutateAsync(reel.id);
      toast.success("Reel deleted successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete reel");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Reel</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>"{reel?.title}"</strong>?
            <br />
            <br />
            This action cannot be undone. The reel will be permanently removed
            from your collection.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteReel.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteReel.isPending}
          >
            {deleteReel.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
