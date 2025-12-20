import { Reel } from "@/types/reel";
import { Play } from "lucide-react";

interface ReelCardProps {
  reel: Reel;
  onClick: () => void;
}

export function ReelCard({ reel, onClick }: ReelCardProps) {
  return (
    <button
      onClick={onClick}
      className="calm-card w-full text-left active:scale-[0.99]"
    >
      {/* Title - Focus on content first */}
      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
        {reel.title}
      </h3>

      {/* Summary - Primary content */}
      <p className="text-sm text-muted-foreground mb-3 line-clamp-3 leading-relaxed">
        {reel.summary.replace(/[•-]\s*/g, '').replace(/\n/g, ' ')}
      </p>

      {/* Thumbnail - Secondary */}
      <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-3 bg-muted">
        <img
          src={reel.thumbnailUrl}
          alt={reel.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-xs text-white/90 bg-black/60 px-2 py-1 rounded-md">
          <Play className="w-3 h-3 fill-current" />
          <span>@{reel.creatorHandle}</span>
        </div>
      </div>

      {/* Tags - Neutral chips */}
      <div className="flex flex-wrap gap-1.5">
        {reel.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="tag-chip">
            #{tag}
          </span>
        ))}
        {reel.tags.length > 3 && (
          <span className="tag-chip">+{reel.tags.length - 3}</span>
        )}
      </div>
    </button>
  );
}
