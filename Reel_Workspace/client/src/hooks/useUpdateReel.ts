import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { Reel } from "../lib/types";

interface UpdateReelData {
  title?: string;
  folderId?: string;
  tags?: string[];
}

export const useUpdateReel = (reelId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateReelData): Promise<Reel> => {
      const response = await api.patch(`/api/reel/${reelId}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch the reel query
      queryClient.invalidateQueries({ queryKey: ["reel", reelId] });
      // Also invalidate reels list
      queryClient.invalidateQueries({ queryKey: ["reels"] });
    },
  });
};
