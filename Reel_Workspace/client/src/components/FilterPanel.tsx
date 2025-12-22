import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFolders } from "@/hooks/useFolders";

interface FilterPanelProps {
  onApplyFilters: (filters: FilterState) => void;
  onClearFilters: () => void;
  initialFilters?: FilterState;
  availableTags?: string[];
}

export interface FilterState {
  tags: string[];
  folders: string[];
  dateRange: "all" | "7days" | "30days" | "custom";
  customDateRange?: {
    start?: string;
    end?: string;
  };
}

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
  { value: "custom", label: "Custom Range" },
];

export function FilterPanel({
  onApplyFilters,
  onClearFilters,
  initialFilters,
  availableTags = [],
}: FilterPanelProps) {
  const { data: folders = [] } = useFolders();
  const [isOpen, setIsOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      tags: [],
      folders: [],
      dateRange: "all",
    }
  );

  const handleTagToggle = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleFolderToggle = (folderId: string) => {
    setFilters((prev) => ({
      ...prev,
      folders: prev.folders.includes(folderId)
        ? prev.folders.filter((f) => f !== folderId)
        : [...prev.folders, folderId],
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    setIsOpen(false);
  };

  const handleClear = () => {
    const clearedFilters: FilterState = {
      tags: [],
      folders: [],
      dateRange: "all",
    };
    setFilters(clearedFilters);
    onClearFilters();
    setIsOpen(false);
  };

  const activeFilterCount =
    filters.tags.length +
    filters.folders.length +
    (filters.dateRange !== "all" ? 1 : 0);

  return (
    <div className="relative">
      {/* Filter Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Filter className="w-4 h-4 mr-2" />
        Filters
        {activeFilterCount > 0 && (
          <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {/* Filter Panel Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Filters</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Range</Label>
              <div className="space-y-2">
                {DATE_RANGE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="dateRange"
                      value={option.value}
                      checked={filters.dateRange === option.value}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: e.target.value as any,
                        }))
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-foreground">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>

              {/* Custom Date Range Inputs */}
              {filters.dateRange === "custom" && (
                <div className="mt-2 space-y-2 pl-6">
                  <div>
                    <Label className="text-xs">Start Date</Label>
                    <input
                      type="date"
                      className="w-full mt-1 px-2 py-1 text-sm border border-border rounded bg-background"
                      value={filters.customDateRange?.start || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          customDateRange: {
                            ...prev.customDateRange,
                            start: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">End Date</Label>
                    <input
                      type="date"
                      className="w-full mt-1 px-2 py-1 text-sm border border-border rounded bg-background"
                      value={filters.customDateRange?.end || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          customDateRange: {
                            ...prev.customDateRange,
                            end: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Folders */}
            {folders.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Folders</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {folders.map((folder) => (
                    <label
                      key={folder.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={filters.folders.includes(folder.id)}
                        onCheckedChange={() => handleFolderToggle(folder.id)}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: folder.color }}
                        />
                        <span className="text-sm text-foreground">
                          {folder.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({folder.reelCount})
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {availableTags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tags</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableTags.map((tag) => (
                    <label
                      key={tag}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={filters.tags.includes(tag)}
                        onCheckedChange={() => handleTagToggle(tag)}
                      />
                      <span className="text-sm text-foreground">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="flex-1"
              >
                Clear All
              </Button>
              <Button size="sm" onClick={handleApply} className="flex-1">
                Apply Filters
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
