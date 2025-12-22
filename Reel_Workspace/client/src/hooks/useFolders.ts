import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import { Folder } from "../lib/types";

export const useFolders = () => {
  return useQuery({
    queryKey: ["folders"],
    queryFn: async (): Promise<Folder[]> => {
      const response = await api.get("/api/folders");
      // Map backend fields to frontend types
      const folders = (response.data.data || []).map((folder: any) => ({
        id: folder.id || folder._id,
        name: folder.name,
        color: folder.color,
        reelCount: folder.reelCount || 0,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
      }));
      return folders;
    },
  });
};
