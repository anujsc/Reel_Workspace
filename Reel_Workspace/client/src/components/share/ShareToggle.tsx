import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Share2 } from "lucide-react";

interface ShareToggleProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
  disabled?: boolean;
}

export function ShareToggle({
  isActive,
  onToggle,
  disabled,
}: ShareToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <Share2 className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <Label
            htmlFor="share-toggle"
            className="text-sm font-medium text-gray-900 cursor-pointer"
          >
            Link Sharing
          </Label>
          <p className="text-xs text-gray-600">
            {isActive ? "Anyone with the link can view" : "Sharing is disabled"}
          </p>
        </div>
      </div>

      <Switch
        id="share-toggle"
        checked={isActive}
        onCheckedChange={onToggle}
        disabled={disabled}
        className="data-[state=checked]:bg-blue-600"
      />
    </div>
  );
}
