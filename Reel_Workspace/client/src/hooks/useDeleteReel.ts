import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

export const useDeleteReel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reelId: string) => {
      console.log("🗑️ Deleting reel:", reelId);
      const response = await api.delete(`/api/reel/${reelId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all reel-related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["reels"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      console.log("✅ Reel deleted successfully - Cache invalidated");
    },
    onError: (error: any) => {
      console.error("❌ Failed to delete reel:", error);
    },
  });
};
