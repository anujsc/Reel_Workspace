import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { Reel } from "../lib/types";

interface ExtractReelResponse {
  reel: Reel;
  message?: string;
}

interface ExtractReelError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

export const useExtractReel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (url: string): Promise<ExtractReelResponse> => {
      // Backend expects 'instagramUrl' field, not 'url'
      const response = await api.post("/api/reel/extract", {
        instagramUrl: url,
      });
      // Backend wraps response in { success, data: { reel } }
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch reels query to show the new reel
      queryClient.invalidateQueries({ queryKey: ["reels"] });
      // Invalidate folders query to update folder list and reel counts
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
    onError: (error: ExtractReelError) => {
      console.error("Extract reel error:", error);
    },
  });
};
