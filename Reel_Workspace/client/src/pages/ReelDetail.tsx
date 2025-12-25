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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Enhanced Header with Glassmorphism */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="gap-2 hover:bg-muted/80 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">
              Back to Dashboard
            </span>
            <span className="sm:hidden font-medium">Back</span>
          </Button>

          {/* Action Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="gap-2 hover:bg-muted/80 border-border/60 transition-all"
            >
              <Edit2 className="w-4 h-4" />
              Edit Title
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="gap-2 shadow-sm hover:shadow transition-all"
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
                  className="h-10 w-10 hover:bg-muted/80"
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

      {/* Enhanced Split Screen Layout - Full Width */}
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Column - Source Info (28% on desktop) */}
          <div className="w-full lg:w-[28%] lg:sticky lg:top-24 lg:self-start">
            <div className="calm-card shadow-lg border-border/60 hover:shadow-xl transition-shadow duration-300">
              <ReelSource reel={reel} />
            </div>
          </div>

          {/* Right Column - Knowledge Tabs (72% on desktop) */}
          <div className="w-full lg:w-[72%] flex flex-col">
            <div className="calm-card shadow-lg border-border/60 min-h-[600px] flex flex-col">
              <ReelKnowledge reel={reel} />
            </div>
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
