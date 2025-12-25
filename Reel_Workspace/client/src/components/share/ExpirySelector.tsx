import { Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExpirySelectorProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  disabled?: boolean;
}

const expiryOptions = [
  { label: "Never", value: undefined },
  { label: "1 Day", value: 1 },
  { label: "3 Days", value: 3 },
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
];

export function ExpirySelector({
  value,
  onChange,
  disabled,
}: ExpirySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Link Expires In
      </label>

      <Select
        value={value?.toString() || "never"}
        onValueChange={(val) =>
          onChange(val === "never" ? undefined : parseInt(val))
        }
        disabled={disabled}
      >
        <SelectTrigger className="bg-slate-50 border-gray-200 hover:border-blue-400 transition-colors">
          <SelectValue placeholder="Select expiry" />
        </SelectTrigger>
        <SelectContent>
          {expiryOptions.map((option) => (
            <SelectItem
              key={option.value || "never"}
              value={option.value?.toString() || "never"}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
