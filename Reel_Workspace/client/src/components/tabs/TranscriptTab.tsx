import { useState } from "react";
import { Reel } from "../../lib/types";
import { Button } from "@/components/ui/button";
import { Copy, Check, FileText } from "lucide-react";
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2.5 text-foreground">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          Full Transcript
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
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
      <div className="p-6 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/40 min-h-[300px]">
        <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-base">
          {reel.transcript || "No transcript available"}
        </p>
      </div>
    </div>
  );
}
