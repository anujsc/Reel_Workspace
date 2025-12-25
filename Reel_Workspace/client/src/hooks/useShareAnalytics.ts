import { useState, useEffect } from "react";
import api from "@/services/api";

interface ShareAnalytics {
  viewCount: number;
  expiresAt: string | null;
  createdAt: string;
}

interface UseShareAnalyticsReturn {
  analytics: ShareAnalytics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useShareAnalytics(
  folderId: string,
  isOpen: boolean
): UseShareAnalyticsReturn {
  const [analytics, setAnalytics] = useState<ShareAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!folderId || !isOpen) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/share/folder/${folderId}/status`);

      if (response.data.data.isShared) {
        setAnalytics({
          viewCount: response.data.data.viewCount,
          expiresAt: response.data.data.expiresAt,
          createdAt: response.data.data.createdAt,
        });
      } else {
        setAnalytics(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch analytics");
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [folderId, isOpen]);

  return {
    analytics,
    isLoading,
    error,
    refetch: fetchAnalytics,
  };
}
