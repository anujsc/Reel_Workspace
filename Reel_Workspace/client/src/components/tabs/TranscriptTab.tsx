import { useState } from "react";
import { Reel } from "../../lib/types";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "../../utils/clipboard";

interface TranscriptTabProps {
  reel: Reel;
}

export function TranscriptTab({ reel }: TranscriptTabProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(reel.transcript);
    if (success) {
      setCopied(true);
      toast.success("Transcript copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy transcript");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Full Transcript</h3>
        <Button variant="outline" size="sm" onClick={handleCopy}>
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
      <div className="calm-card">
        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {reel.transcript || "No transcript available"}
        </p>
      </div>
    </div>
  );
}
