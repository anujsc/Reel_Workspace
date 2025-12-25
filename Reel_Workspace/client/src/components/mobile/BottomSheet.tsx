import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[]; // Percentage heights [50, 90]
  defaultSnap?: number; // Index of default snap point
}

/**
 * Mobile bottom sheet component
 * Draggable with snap points, optimized for thumb reach
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [90],
  defaultSnap = 0,
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(defaultSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when sheet is open
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

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - dragStart;

    // Only allow dragging down
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    // Close if dragged down more than 100px
    if (dragOffset > 100) {
      onClose();
    }

    setDragOffset(0);
  };

  if (!isOpen) return null;

  const height = snapPoints[currentSnap];
  const transform = isDragging
    ? `translateY(${dragOffset}px)`
    : "translateY(0)";

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Bottom sheet"}
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

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "absolute bottom-0 left-0 right-0",
          "bg-white rounded-t-3xl shadow-2xl",
          "transition-transform duration-300 ease-out",
          "safe-area-bottom",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{
          height: `${height}vh`,
          transform,
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto h-full px-6 py-4 pb-20">{children}</div>
      </div>
    </div>
  );
}
