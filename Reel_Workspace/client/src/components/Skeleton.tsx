import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-muted skeleton-shimmer",
        className
      )}
    />
  );
}

export function ReelCardSkeleton() {
  return (
    <div className="calm-card animate-fade-in">
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-5/6 mb-3" />
      <Skeleton className="aspect-video w-full rounded-lg mb-3" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-14 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>
    </div>
  );
}

export function ProcessingSkeleton({ step }: { step: string }) {
  const steps = [
    { key: 'downloading', label: 'Step 1: Fetching Reel...' },
    { key: 'transcribing', label: 'Step 2: Transcribing Audio...' },
    { key: 'summarizing', label: 'Step 3: Generating Intelligence...' },
    { key: 'extracting', label: 'Step 4: Extracting Visual Text (OCR)...' },
  ];

  const currentIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="calm-card animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
        <div>
          <p className="font-medium text-foreground">Extraction Engine</p>
          <p className="text-sm text-muted-foreground">Processing your reel...</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-muted rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-foreground rounded-full transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
        />
      </div>
      
      <div className="space-y-2">
        {steps.map((s, index) => (
          <div key={s.key} className="flex items-center gap-3">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-150",
              index < currentIndex 
                ? "step-complete" 
                : index === currentIndex 
                  ? "step-active" 
                  : "step-pending"
            )}>
              {index < currentIndex ? "✓" : index + 1}
            </div>
            <span className={cn(
              "text-sm transition-colors duration-150",
              index === currentIndex ? "text-foreground font-medium" : "text-muted-foreground"
            )}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
