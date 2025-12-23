import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Trash2, Edit2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useReel } from "../hooks/useReel";
import { ReelSource } from "../components/ReelSource";
import { ReelKnowledge } from "../components/ReelKnowledge";
import { DeleteReelDialog } from "@/components/modals/DeleteReelDialog";
import { EditReelTitleModal } from "@/components/modals/EditReelTitleModal";
import { useState } from "react";

export default function ReelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: reel, isLoading, error } = useReel(id);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  console.log("ReelDetail - ID:", id);
  console.log("ReelDetail - Reel data:", reel);
  console.log("ReelDetail - Loading:", isLoading);
  console.log("ReelDetail - Error:", error);

  const handleDeleteSuccess = () => {
    navigate("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !reel) {
    console.error("ReelDetail - Error or no reel:", error);
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Reel not found</h2>
          <p className="text-muted-foreground mb-4">
            The reel you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  console.log("ReelDetail - Rendering with reel:", reel.id, reel.title);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="gap-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>

          {/* Action Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="gap-2 hover:bg-gray-50"
            >
              <Edit2 className="w-4 h-4" />
              Edit Title
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>

          {/* Action Menu - Mobile */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 hover:bg-gray-100"
                >
                  <MoreVertical className="w-5 h-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setIsEditModalOpen(true)}
                  className="cursor-pointer py-3"
                >
                  <Edit2 className="w-4 h-4 mr-3" />
                  <span className="text-base">Edit Title</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="cursor-pointer text-destructive focus:text-destructive py-3"
                >
                  <Trash2 className="w-4 h-4 mr-3" />
                  <span className="text-base">Delete Reel</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Source Info (30% on desktop) */}
          <div className="w-full lg:w-[30%]">
            <ReelSource reel={reel} />
          </div>

          {/* Right Column - Knowledge Tabs (70% on desktop) */}
          <div className="w-full lg:w-[70%]">
            <ReelKnowledge reel={reel} />
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <DeleteReelDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        reel={reel}
        onSuccess={handleDeleteSuccess}
      />

      {/* Edit Title Modal */}
      <EditReelTitleModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        reel={reel}
      />
    </div>
  );
}
