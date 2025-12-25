import { useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { cn } from "@/lib/utils";

interface CopyLinkInputProps {
  url: string;
  className?: string;
}

export function CopyLinkInput({ url, className }: CopyLinkInputProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard(2000);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleCopy = async () => {
    setIsAnimating(true);
    await copyToClipboard(url);

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-gray-700">
        Share via Link
      </label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={url}
            readOnly
            className="pr-4 bg-slate-50 border-gray-200 hover:border-blue-400 transition-colors truncate text-sm"
            aria-label="Share link"
          />
        </div>

        <Button
          onClick={handleCopy}
          variant="outline"
          className={cn(
            "gap-2 min-w-[140px] transition-all duration-200",
            isAnimating && "scale-[0.98]",
            isCopied && "border-green-500 text-green-600 bg-green-50"
          )}
          aria-label={isCopied ? "Link copied" : "Copy link to clipboard"}
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </>
          )}
        </Button>
      </div>

      {isCopied && (
        <p className="text-xs text-green-600 animate-in fade-in slide-in-from-top-1 duration-200">
          ✓ Link copied to clipboard
        </p>
      )}
    </div>
  );
}
