import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Reel, Folder } from "@/types/reel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Eye } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

export default function SharedFolder() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [reels, setReels] = useState<Reel[]>([]);
  const [viewCount, setViewCount] = useState(0);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    fetchSharedFolder();
  }, [shareToken]);

  const fetchSharedFolder = async () => {
    try {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const response = await axios.get(`${baseUrl}/api/share/${shareToken}`);

      setFolder(response.data.data.folder);
      setReels(response.data.data.reels);
      setViewCount(response.data.data.viewCount);
      setExpiresAt(response.data.data.expiresAt);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to load shared folder",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading shared folder...</p>
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">Folder Not Found</h1>
          <p className="text-muted-foreground">
            This share link may have expired or been deactivated.
          </p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: folder.color + "20" }}
              >
                📁
              </div>
              <div>
                <h1 className="text-xl font-bold">{folder.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {reels.length} reel{reels.length !== 1 ? "s" : ""} shared
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span>{viewCount} views</span>
            </div>
          </div>
          {expiresAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Expires: {new Date(expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Reels Grid */}
      <div className="container mx-auto px-4 py-8">
        {reels.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">This folder is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {reels.map((reel) => (
              <div
                key={reel.id}
                className="group relative bg-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg"
              >
                {/* Thumbnail */}
                <div className="aspect-[9/16] relative overflow-hidden bg-muted">
                  {reel.thumbnailUrl ? (
                    <img
                      src={reel.thumbnailUrl}
                      alt={reel.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl">🎬</span>
                    </div>
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={reel.sourceUrl || reel.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Original
                    </a>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold line-clamp-2">{reel.title}</h3>
                  {reel.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {reel.summary}
                    </p>
                  )}
                  {reel.tags && reel.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {reel.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 bg-background/50 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Powered by Reel Workspace</p>
        </div>
      </div>
    </div>
  );
}
