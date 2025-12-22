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
  const [isHovered, setIsHovered] = useState(false);

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

  return (
    <>
      <div
        className="group relative break-inside-avoid mb-6"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          onClick={handleClick}
          className="w-full text-left bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
        >
          {/* Vertical Thumbnail (9:16) */}
          <div className="relative w-full aspect-[9/16] overflow-hidden bg-muted">
            <img
              src={
                reel.thumbnail ||
                "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=700&fit=crop"
              }
              alt={reel.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Play Icon on Hover */}
            {isHovered && (
              <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Play
                    className="w-8 h-8 text-gray-900 ml-1"
                    fill="currentColor"
                  />
                </div>
              </div>
            )}

            {/* Title & Creator Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h3 className="font-display font-bold text-lg mb-1.5 line-clamp-3 drop-shadow-lg leading-tight">
                {highlightText(reel.title)}
              </h3>
            </div>

            {/* Action Menu - Top Right */}
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
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

          {/* Tags & Metadata */}
          <div className="p-3">
            {/* Tags */}
            {reel.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {reel.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs rounded-md bg-indigo-50 text-indigo-600 font-medium"
                  >
                    #{tag}
                  </span>
                ))}
                {reel.tags.length > 3 && (
                  <span className="px-2 py-0.5 text-xs rounded-md bg-gray-100 text-gray-600 font-medium">
                    +{reel.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {reel.folder && (
                <div className="flex items-center gap-1">
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
          </div>
        </button>
      </div>

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
