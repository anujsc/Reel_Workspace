import { useNavigate } from "react-router-dom";
import { Reel } from "../lib/types";
import { Folder } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ReelCardProps {
  reel: Reel;
  highlightQuery?: string;
}

export function ReelCard({ reel, highlightQuery }: ReelCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/reel/${reel.id}`);
  };

  // Highlight matching keywords in text
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
    <button
      onClick={handleClick}
      className="group calm-card w-full text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]"
    >
      {/* Thumbnail (Square) */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3 bg-muted">
        <img
          src={
            reel.thumbnail ||
            "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop"
          }
          alt={reel.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Title */}
      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
        {highlightText(reel.title)}
      </h3>

      {/* Summary */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-3 leading-relaxed">
        {highlightText(reel.summary)}
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
    </button>
  );
}
