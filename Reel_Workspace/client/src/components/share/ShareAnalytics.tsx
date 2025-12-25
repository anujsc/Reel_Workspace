import { Eye, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ShareAnalyticsProps {
  viewCount: number;
  expiresAt: string | null;
  createdAt: string;
}

export function ShareAnalytics({
  viewCount,
  expiresAt,
  createdAt,
}: ShareAnalyticsProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
      <div className="flex items-center gap-2 flex-1">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <Eye className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-gray-600">Total Views</p>
          <p className="text-lg font-semibold text-gray-900">{viewCount}</p>
        </div>
      </div>

      {expiresAt && (
        <div className="flex items-center gap-2 flex-1">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Expires</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDistanceToNow(new Date(expiresAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
