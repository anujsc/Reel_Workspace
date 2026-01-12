import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatFABProps {
  onClick: () => void;
  isOpen: boolean;
}

/**
 * Floating Action Button for opening chat
 * Premium design with pulse animation and elevated shadow
 */
export function ChatFAB({ onClick, isOpen }: ChatFABProps) {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-[9999]",
        "w-14 h-14 md:w-16 md:h-16",
        "rounded-full",
        "bg-gradient-to-br from-primary via-primary to-slate",
        "text-primary-foreground",
        "shadow-lg hover:shadow-xl",
        "transition-all duration-300",
        "hover:scale-110 active:scale-95",
        "flex items-center justify-center",
        "group",
        "animate-fade-in"
      )}
      aria-label="Open AI Assistant"
    >
      <Sparkles className="w-6 h-6 md:w-7 md:h-7 group-hover:rotate-12 transition-transform duration-300" />

      {/* Pulse ring animation */}
      <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
    </button>
  );
}
