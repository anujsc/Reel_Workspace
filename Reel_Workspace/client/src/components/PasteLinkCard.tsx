import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap } from "lucide-react";
import { ProcessingSkeleton } from "./Skeleton";
import { useExtractReel } from "../hooks/useExtractReel";
import { validateInstagramUrl } from "../utils/validators";
import { toast } from "sonner";

export function PasteLinkCard() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [processingStep, setProcessingStep] = useState<string>("idle");
  const [startTime, setStartTime] = useState<number>(0);

  const { mutate: extractReel, isPending } = useExtractReel();

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

    // Simulate processing steps with realistic timing based on actual backend services
    // Total: ~35 seconds (matches 30-40s expectation)
    const steps = [
      { name: "fetching", duration: 2000 },      // ~2s - Fetch Instagram media
      { name: "downloading", duration: 3000 },   // ~3s - Download video
      { name: "processing", duration: 4000 },    // ~4s - Audio extraction + thumbnail (parallel)
      { name: "transcribing", duration: 8000 },  // ~8s - AI transcription with Gemini
      { name: "analyzing", duration: 10000 },    // ~10s - AI summary generation with Groq
      { name: "extracting", duration: 5000 },    // ~5s - OCR text extraction
      { name: "finalizing", duration: 3000 },    // ~3s - Save to database
    ];
    
    let currentStep = 0;
    let stepTimeoutId: NodeJS.Timeout;
    const processingStartTime = Date.now();
    setStartTime(processingStartTime);

    const advanceStep = () => {
      if (currentStep < steps.length) {
        setProcessingStep(steps[currentStep].name);
        currentStep++;
        if (currentStep < steps.length) {
          stepTimeoutId = setTimeout(advanceStep, steps[currentStep - 1].duration);
        }
      }
    };

    advanceStep();

    extractReel(url, {
      onSuccess: () => {
        if (stepTimeoutId) clearTimeout(stepTimeoutId);
        setProcessingStep("completed");
        toast.success("Reel extracted successfully", {
          description: "Your insights are ready"
        });
        setUrl("");
        setTimeout(() => {
          setProcessingStep("idle");
          setStartTime(0);
        }, 500);
      },
      onError: (error: any) => {
        if (stepTimeoutId) clearTimeout(stepTimeoutId);
        setProcessingStep("error");

        // Handle different error types with actionable guidance
        const errorMessage = error?.response?.data?.message || error?.message;

        if (
          error?.response?.status === 409 ||
          errorMessage?.toLowerCase().includes("already exists")
        ) {
          setError("This reel already exists in your collection");
          toast.error("Duplicate Reel", {
            description: "This reel has already been extracted."
          });
        } else if (error?.response?.status === 400) {
          setError(errorMessage || "Invalid URL or request");
          toast.error("Invalid Request", {
            description: errorMessage || "Please check the URL and try again."
          });
        } else if (error?.response?.status === 429) {
          setError("Rate limit exceeded. Please try again in a few minutes.");
          toast.error("Too Many Requests", {
            description: "Please wait a moment before trying again."
          });
        } else {
          setError(errorMessage || "Failed to extract reel. Please try again.");
          toast.error("Extraction Failed", {
            description: "Please check your connection and try again."
          });
        }

        setTimeout(() => {
          setProcessingStep("idle");
          setStartTime(0);
        }, 500);
      },
    });
  };

  const isProcessing =
    processingStep !== "idle" &&
    processingStep !== "completed" &&
    processingStep !== "error";

  if (isProcessing) {
    return <ProcessingSkeleton step={processingStep} startTime={startTime} />;
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Add Knowledge from Instagram
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Paste any Reel link to extract insights, summaries, and key
            learnings
          </p>
        </div>

        {/* Input Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              placeholder="https://instagram.com/reel/..."
              className="h-11 text-base"
              disabled={isPending}
            />
          </div>
          <Button
            type="submit"
            disabled={isPending || !url.trim()}
            className="h-11 px-6 font-medium"
          >
            <Zap className="w-4 h-4 mr-2" />
            Extract
          </Button>
        </div>

        {error && (
          <p className="text-xs text-destructive mt-3 animate-fade-in flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-destructive" />
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
