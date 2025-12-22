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
    <div className="space-y-6">
      {/* Summary */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Summary
          </h3>
          <Button variant="outline" size="sm" onClick={handleCopySummary}>
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </>
            )}
          </Button>
        </div>
        <p className="text-muted-foreground whitespace-pre-wrap">
          {reel.summary}
        </p>
      </div>

      {/* Key Points */}
      {reel.keyPoints && reel.keyPoints.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Key Points</h3>
          <ul className="space-y-2">
            {reel.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actionable Checklist */}
      {reel.actionableChecklist && reel.actionableChecklist.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Actionable Checklist</h3>
          <div className="space-y-2">
            {reel.actionableChecklist.map((item, index) => (
              <label
                key={index}
                className="flex items-start gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-gray-300"
                />
                <span className="text-muted-foreground">{item}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Quick Reference Cards */}
      {reel.quickReferenceCard && reel.quickReferenceCard.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Quick Reference</h3>
          <div className="grid gap-3">
            {reel.quickReferenceCard.map((card, index) => (
              <div key={index} className="calm-card">
                <h4 className="font-semibold mb-2">{card.title}</h4>
                <p className="text-sm text-muted-foreground">{card.content}</p>
                {card.category && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                    {card.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
