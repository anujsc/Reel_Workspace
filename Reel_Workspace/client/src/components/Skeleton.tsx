import { cn } from "@/lib/utils";
import React from "react";

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

export function ProcessingSkeleton({ step, startTime }: { step: string; startTime?: number }) {
  const [elapsedTime, setElapsedTime] = React.useState(0);

  React.useEffect(() => {
    if (!startTime) return;
    
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [startTime]);

  const steps = [
    { 
      key: 'fetching', 
      label: 'Fetching media',
      duration: 2
    },
    { 
      key: 'downloading', 
      label: 'Downloading video',
      duration: 3
    },
    { 
      key: 'processing', 
      label: 'Processing audio',
      duration: 4
    },
    { 
      key: 'transcribing', 
      label: 'Transcribing content',
      duration: 8
    },
    { 
      key: 'analyzing', 
      label: 'Analyzing with AI',
      duration: 10
    },
    { 
      key: 'extracting', 
      label: 'Extracting text',
      duration: 5
    },
    { 
      key: 'finalizing', 
      label: 'Finalizing',
      duration: 3
    },
  ];

  const currentIndex = steps.findIndex(s => s.key === step);
  const currentStep = steps[currentIndex] || steps[0];
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-8 shadow-sm animate-fade-in max-w-2xl mx-auto">
      {/* Header with Timer */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-base font-medium text-foreground">
          Processing your reel
        </h3>
        <span className="text-sm text-muted-foreground font-mono tabular-nums">
          {elapsedTime}s
        </span>
      </div>
      
      {/* Current Step */}
      <p className="text-sm text-muted-foreground mb-6">
        {currentStep.label}...
      </p>

      {/* Progress Bar - Moved up for better hierarchy */}
      <div className="mb-6">
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Info Message - Better positioned after progress */}
      <div className="mb-6 p-3.5 bg-secondary/50 rounded-lg border border-border/50">
        <p className="text-xs text-muted-foreground leading-relaxed">
          This will take some time to extract your valuable details. We're analyzing the video, transcribing audio, and generating comprehensive insights.
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-2.5">
        {steps.map((s, index) => {
          const isComplete = index < currentIndex;
          const isActive = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div 
              key={s.key} 
              className="flex items-center gap-3"
            >
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 shrink-0",
                isComplete && "bg-foreground",
                isActive && "bg-foreground",
                isPending && "bg-muted"
              )}>
                {isComplete ? (
                  <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : isActive ? (
                  <div className="w-2 h-2 bg-background rounded-full" />
                ) : (
                  <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
                )}
              </div>
              <span className={cn(
                "text-sm transition-colors duration-200 flex-1",
                isActive && "text-foreground font-medium",
                isComplete && "text-muted-foreground",
                isPending && "text-muted-foreground/50"
              )}>
                {s.label}
              </span>
              {isActive && (
                <span className="text-xs text-muted-foreground/60 font-mono tabular-nums">
                  ~{s.duration}s
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground/60 text-center">
          Typically takes 30-40 seconds
        </p>
      </div>
    </div>
  );
}
