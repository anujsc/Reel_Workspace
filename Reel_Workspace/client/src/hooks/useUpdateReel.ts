import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

interface UpdateReelData {
  title?: string;
  folderId?: string;
  tags?: string[];
}

export const useUpdateReel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateReelData }) => {
      console.log("✏️ Updating reel:", id, data);
      const response = await api.patch(`/api/reel/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all reel-related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["reels"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
      queryClient.invalidateQueries({ queryKey: ["reel"] });
      // Invalidate folders to update reel counts when moving reels between folders
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      console.log("✅ Reel updated successfully - Cache invalidated");
    },
    onError: (error: any) => {
      console.error("❌ Failed to update reel:", error);
    },
  });
};
