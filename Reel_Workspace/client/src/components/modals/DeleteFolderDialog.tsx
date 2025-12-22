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
import { useDeleteFolder } from "@/hooks/useFolders";
import { toast } from "sonner";
import { Folder } from "@/lib/types";

interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: Folder | null;
}

export function DeleteFolderDialog({
  open,
  onOpenChange,
  folder,
}: DeleteFolderDialogProps) {
  const deleteFolder = useDeleteFolder();

  const handleDelete = async () => {
    if (!folder) return;

    if (folder.isDefault) {
      toast.error("Cannot delete default folder");
      onOpenChange(false);
      return;
    }

    try {
      await deleteFolder.mutateAsync(folder.id);
      toast.success("Folder deleted successfully");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete folder");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Folder</AlertDialogTitle>
          <AlertDialogDescription>
            {folder?.isDefault ? (
              "This is a default folder and cannot be deleted."
            ) : folder?.reelCount ? (
              <>
                This folder contains <strong>{folder.reelCount}</strong>{" "}
                {folder.reelCount === 1 ? "reel" : "reels"}. All reels will be
                moved to Uncategorized. This action cannot be undone.
              </>
            ) : (
              "Are you sure you want to delete this folder? This action cannot be undone."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {!folder?.isDefault && (
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteFolder.isPending}
            >
              {deleteFolder.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
