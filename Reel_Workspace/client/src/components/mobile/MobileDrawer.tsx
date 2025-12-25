import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  position?: "left" | "right";
}

/**
 * Mobile slide-out drawer component
 * Swipeable from edge, with backdrop
 */
export function MobileDrawer({
  isOpen,
  onClose,
  children,
  title,
  position = "left",
}: MobileDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Drawer"}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-sm",
          "transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          "absolute top-0 bottom-0 w-[280px] max-w-[85vw]",
          "bg-white shadow-2xl",
          "transition-transform duration-300 ease-out",
          "safe-area-top safe-area-bottom",
          position === "left" ? "left-0" : "right-0",
          position === "left" && "safe-area-left",
          position === "right" && "safe-area-right",
          isOpen
            ? "translate-x-0"
            : position === "left"
            ? "-translate-x-full"
            : "translate-x-full"
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto h-full pb-20">{children}</div>
      </div>
    </div>
  );
}
