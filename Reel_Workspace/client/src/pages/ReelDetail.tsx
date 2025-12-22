import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "../services/api";
import { Reel } from "../lib/types";

export default function ReelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: reel,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["reel", id],
    queryFn: async (): Promise<Reel> => {
      const response = await api.get(`/api/reel/${id}`);
      // Backend wraps response in { success, data: reel }
      return response.data.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !reel) {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mb-2">{reel.title}</h1>
        </div>

        {/* Thumbnail */}
        {reel.thumbnail && (
          <div className="aspect-video w-full rounded-lg overflow-hidden mb-6">
            <img
              src={reel.thumbnail}
              alt={reel.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Summary */}
        <div className="calm-card mb-6">
          <h2 className="text-xl font-semibold mb-3">Summary</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {reel.summary}
          </p>
        </div>

        {/* Transcript */}
        {reel.transcript && (
          <div className="calm-card mb-6">
            <h2 className="text-xl font-semibold mb-3">Transcript</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {reel.transcript}
            </p>
          </div>
        )}

        {/* Tags */}
        {reel.tags.length > 0 && (
          <div className="calm-card">
            <h2 className="text-xl font-semibold mb-3">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {reel.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
