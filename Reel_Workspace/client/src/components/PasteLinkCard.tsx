import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, Zap } from "lucide-react";
import { ProcessingSkeleton } from "./Skeleton";
import { ProcessingStep } from "@/types/reel";

interface PasteLinkCardProps {
  onExtract: (url: string) => void;
  processingStep: ProcessingStep;
}

export function PasteLinkCard({ onExtract, processingStep }: PasteLinkCardProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const validateInstagramUrl = (url: string): boolean => {
    const regex = /^https?:\/\/(www\.)?instagram\.com\/(reel|p)\/[\w-]+/;
    return regex.test(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Please paste an Instagram Reel link");
      return;
    }

    if (!validateInstagramUrl(url)) {
      setError("Please enter a valid Instagram Reel URL");
      return;
    }

    onExtract(url);
  };

  const isProcessing = processingStep !== 'idle' && processingStep !== 'completed' && processingStep !== 'error';

  if (isProcessing) {
    return <ProcessingSkeleton step={processingStep} />;
  }

  return (
    <form onSubmit={handleSubmit} className="calm-card animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
          <Link className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Paste Instagram Link</h2>
          <p className="text-sm text-muted-foreground">Extract knowledge from any reel</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            placeholder="https://instagram.com/reel/..."
            className="pr-4"
          />
        </div>
        <Button type="submit" disabled={isProcessing}>
          <Zap className="w-4 h-4 mr-2" />
          Process with AI
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive mt-2 animate-fade-in">{error}</p>
      )}
    </form>
  );
}
