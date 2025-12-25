import { useState } from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SocialShareButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  brandColor?: string;
  className?: string;
}

export function SocialShareButton({
  icon: Icon,
  label,
  onClick,
  brandColor = "blue",
  className,
}: SocialShareButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    onClick();

    setTimeout(() => {
      setIsPressed(false);
    }, 200);
  };

  const brandColors: Record<string, string> = {
    whatsapp: "hover:bg-green-50 hover:border-green-400 hover:text-green-700",
    facebook: "hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700",
    twitter: "hover:bg-sky-50 hover:border-sky-400 hover:text-sky-700",
    linkedin: "hover:bg-blue-50 hover:border-blue-600 hover:text-blue-700",
    telegram: "hover:bg-sky-50 hover:border-sky-500 hover:text-sky-700",
    instagram: "hover:bg-pink-50 hover:border-pink-400 hover:text-pink-700",
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className={cn(
        "w-full justify-start gap-3 h-12 transition-all duration-200",
        "hover:shadow-md border-gray-200",
        brandColors[brandColor] || "hover:bg-gray-50",
        isPressed && "scale-[0.98]",
        className
      )}
      aria-label={`Share on ${label}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="font-medium">{label}</span>
    </Button>
  );
}
