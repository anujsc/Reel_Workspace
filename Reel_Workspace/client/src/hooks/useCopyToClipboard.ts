import { useState, useCallback } from "react";

interface UseCopyToClipboardReturn {
  isCopied: boolean;
  copyToClipboard: (text: string) => Promise<boolean>;
  resetCopied: () => void;
}

export function useCopyToClipboard(
  resetDelay: number = 2000
): UseCopyToClipboardReturn {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);

        // Reset after delay
        setTimeout(() => {
          setIsCopied(false);
        }, resetDelay);

        return true;
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        setIsCopied(false);
        return false;
      }
    },
    [resetDelay]
  );

  const resetCopied = useCallback(() => {
    setIsCopied(false);
  }, []);

  return { isCopied, copyToClipboard, resetCopied };
}
