import { useNavigate } from "react-router-dom";
import { Reel } from "../lib/types";
import { Folder, MoreVertical, Trash2, Edit2, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DeleteReelDialog } from "@/components/modals/DeleteReelDialog";
import { EditReelTitleModal } from "@/components/modals/EditReelTitleModal";

interface ReelCardProps {
  reel: Reel;
  highlightQuery?: string;
}

export function ReelCard({ reel, highlightQuery }: ReelCardProps) {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleClick = () => {
    navigate(`/reel/${reel.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const highlightText = (text: string) => {
    if (!highlightQuery || !text) return text;

    const parts = text.split(new RegExp(`(${highlightQuery})`, "gi"));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === highlightQuery.toLowerCase() ? (
            <mark
              key={index}
              className="bg-yellow-200 dark:bg-yellow-800 px-0.5"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Get first sentence or 120 chars of summary as insight preview
  const insightPreview = reel.summary
    ? reel.summary.split(/[.!?]/)[0].substring(0, 120) + "..."
    : "No summary available";

  return (
    <>
      <button
        onClick={handleClick}
        className="group w-full text-left bg-card border border-border rounded-xl overflow-hidden hover:border-foreground/20 hover:shadow-lg transition-all duration-200"
      >
        {/* Horizontal Layout: Thumbnail + Content */}
        <div className="flex gap-4 p-4">
          {/* Compact Thumbnail */}
          <div className="relative w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            <img
              src={
                reel.thumbnail ||
                "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=700&fit=crop"
              }
              alt={reel.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          {/* Content Section - Insight First */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {/* Title */}
            <h3 className="font-semibold text-foreground text-base leading-snug line-clamp-2">
              {highlightText(reel.title)}
            </h3>

            {/* AI Insight Preview */}
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {highlightText(insightPreview)}
            </p>

            {/* Tags - Limit to 2 visible */}
            {reel.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {reel.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs rounded-md bg-secondary text-muted-foreground font-medium"
                  >
                    {tag}
                  </span>
                ))}
                {reel.tags.length > 2 && (
                  <span className="px-2 py-0.5 text-xs rounded-md bg-secondary text-muted-foreground font-medium">
                    +{reel.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Menu */}
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleEditClick}
                  className="cursor-pointer"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Title
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDeleteClick}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Footer Metadata */}
        <div className="px-4 pb-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2">
          {reel.folder && (
            <div className="flex items-center gap-1.5">
              <Folder className="w-3 h-3" />
              <span>{reel.folder}</span>
            </div>
          )}

          {reel.createdAt && (
            <span>
              {formatDistanceToNow(new Date(reel.createdAt), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
      </button>

      {/* Delete Dialog */}
      <DeleteReelDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        reel={reel}
      />

      {/* Edit Title Modal */}
      <EditReelTitleModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        reel={reel}
      />
    </>
  );
}
