import { Reel } from "../../lib/types";
import { CheckCircle2, Lightbulb, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "../../utils/clipboard";
import { toast } from "sonner";
import { useState } from "react";

interface AIInsightsTabProps {
  reel: Reel;
}

export function AIInsightsTab({ reel }: AIInsightsTabProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = async () => {
    const success = await copyToClipboard(reel.summary);
    if (success) {
      setCopied(true);
      toast.success("Summary copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy summary");
    }
  };

  return (
    <div className="space-y-8">
      {/* Summary - Enhanced Card */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2.5 text-foreground">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            Summary
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopySummary}
            className="gap-2 hover:bg-muted/80 border-border/60"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
        </div>
        <div className="p-5 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/40">
          <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-base">
            {reel.summary}
          </p>
        </div>
      </div>

      {/* Key Points - Enhanced List */}
      {reel.keyPoints && reel.keyPoints.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-foreground">Key Points</h3>
          <ul className="space-y-3">
            {reel.keyPoints.map((point, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/40 hover:border-primary/30 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground/90 leading-relaxed">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actionable Checklist - Enhanced Interactive */}
      {reel.actionableChecklist && reel.actionableChecklist.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-foreground">
            Actionable Checklist
          </h3>
          <div className="space-y-2.5">
            {reel.actionableChecklist.map((item, index) => (
              <label
                key={index}
                className="flex items-start gap-3.5 p-4 rounded-xl bg-muted/20 border border-border/40 hover:bg-muted/40 hover:border-primary/30 cursor-pointer transition-all group"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 w-5 h-5 rounded-md border-2 border-border text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer transition-all"
                />
                <span className="text-foreground/90 leading-relaxed group-hover:text-foreground transition-colors">
                  {item}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
