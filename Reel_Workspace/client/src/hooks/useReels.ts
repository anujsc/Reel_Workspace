import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import { Reel } from "../lib/types";

interface UseReelsResponse {
  reels: Reel[];
  total: number;
}

interface UseReelsParams {
  limit?: number;
  skip?: number;
  folder?: string;
}

export const useReels = (params: UseReelsParams = {}) => {
  const { limit = 20, skip = 0, folder } = params;

  return useQuery({
    queryKey: ["reels", limit, skip, folder],
    queryFn: async (): Promise<UseReelsResponse> => {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        skip: skip.toString(),
      });

      if (folder) {
        queryParams.append("folder", folder);
      }

      const response = await api.get(`/api/reel?${queryParams.toString()}`);
      // Backend wraps response in { success, data: { reels, total } }
      return response.data.data;
    },
  });
};
