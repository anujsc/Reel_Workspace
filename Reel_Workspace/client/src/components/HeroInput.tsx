import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { ProcessingSkeleton } from "./Skeleton";
import { useExtractReel } from "../hooks/useExtractReel";
import { validateInstagramUrl } from "../utils/validators";
import { toast } from "sonner";

export function HeroInput() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [processingStep, setProcessingStep] = useState<string>("idle");
  const [isFocused, setIsFocused] = useState(false);

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
    }, 2000);

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
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <div
        className={`
          relative bg-white/80 backdrop-blur-md rounded-2xl p-6
          shadow-xl transition-all duration-300
          ${isFocused ? "shadow-2xl scale-[1.01]" : ""}
        `}
      >
        <div className="mb-4">
          <h2 className="text-2xl font-display font-bold text-foreground tracking-tight mb-2">
            Turn Reels into Knowledge
          </h2>
          <p className="text-sm text-muted-foreground">
            Paste any Instagram Reel link and let AI extract the insights
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="https://instagram.com/reel/..."
              className="w-full px-4 py-3 text-base rounded-xl border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
              disabled={isPending}
            />
          </div>
          <Button
            type="submit"
            disabled={isPending || !url.trim()}
            className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Analyze with AI
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>
        </div>

        {error && (
          <p className="text-xs text-destructive mt-3 animate-fade-in flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-destructive" />
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
