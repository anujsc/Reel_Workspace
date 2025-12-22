import { useNavigate } from "react-router-dom";
import { Reel } from "../lib/types";
import { Folder } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ReelCardProps {
  reel: Reel;
}

export function ReelCard({ reel }: ReelCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/reel/${reel.id}`);
  };

  return (
    <button
      onClick={handleClick}
      className="calm-card w-full text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] w-full rounded-lg overflow-hidden mb-3 bg-muted">
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
      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
        {reel.title}
      </h3>

      {/* Summary */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-3 leading-relaxed">
        {reel.summary}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {reel.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700"
          >
            #{tag}
          </span>
        ))}
        {reel.tags.length > 3 && (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
            +{reel.tags.length - 3}
          </span>
        )}
      </div>

      {/* Footer: Folder and Date */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {reel.folder && (
          <div className="flex items-center gap-1">
            <Folder className="w-3 h-3" />
            <span>{reel.folder}</span>
          </div>
        )}
        {reel.createdAt && (
          <span>
            {formatDistanceToNow(new Date(reel.createdAt), { addSuffix: true })}
          </span>
        )}
      </div>
    </button>
  );
}
