import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, Zap } from "lucide-react";
import { ProcessingSkeleton } from "./Skeleton";
import { useExtractReel } from "../hooks/useExtractReel";
import { validateInstagramUrl } from "../utils/validators";
import { toast } from "sonner";

export function PasteLinkCard() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [processingStep, setProcessingStep] = useState<string>("idle");

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

    // Simulate processing steps for better UX
    const steps = ["downloading", "transcribing", "summarizing", "extracting"];
    let currentStep = 0;

    setProcessingStep(steps[0]);

    const stepInterval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setProcessingStep(steps[currentStep]);
      } else {
        clearInterval(stepInterval);
      }
    }, 2000); // Change step every 2 seconds

    extractReel(url, {
      onSuccess: () => {
        clearInterval(stepInterval);
        setProcessingStep("completed");
        toast.success("Reel added successfully!");
        setUrl("");
        setTimeout(() => setProcessingStep("idle"), 500);
      },
      onError: (error: any) => {
        clearInterval(stepInterval);
        setProcessingStep("error");

        // Handle different error types
        const errorMessage = error?.response?.data?.message || error?.message;

        if (
          error?.response?.status === 409 ||
          errorMessage?.toLowerCase().includes("already exists")
        ) {
          setError("This reel already exists in your collection");
          toast.error("This reel already exists");
        } else if (error?.response?.status === 400) {
          setError(errorMessage || "Invalid URL or request");
          toast.error(errorMessage || "Invalid request");
        } else {
          setError(errorMessage || "Failed to extract reel. Please try again.");
          toast.error("Failed to extract reel");
        }

        setTimeout(() => setProcessingStep("idle"), 500);
      },
    });
  };

  const isProcessing =
    processingStep !== "idle" &&
    processingStep !== "completed" &&
    processingStep !== "error";

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
          <h2 className="font-semibold text-foreground">
            Paste Instagram Link
          </h2>
          <p className="text-sm text-muted-foreground">
            Extract knowledge from any reel
          </p>
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
            disabled={isPending}
          />
        </div>
        <Button type="submit" disabled={isPending || !url.trim()}>
          <Zap className="w-4 h-4 mr-2" />
          Analyze with AI
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive mt-2 animate-fade-in">{error}</p>
      )}
    </form>
  );
}
