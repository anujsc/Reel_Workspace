import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { Folder } from "../lib/types";

export const useFolders = () => {
  return useQuery({
    queryKey: ["folders"],
    queryFn: async (): Promise<Folder[]> => {
      const response = await api.get("/api/folders");
      console.log("📁 Folders API Response:", response.data);

      // Backend returns: { success, data: { folders: [...], total }, message }
      const foldersArray =
        response.data.data?.folders || response.data.data || [];
      console.log("📁 Folders Array:", foldersArray);

      // Map backend fields to frontend types
      const folders = foldersArray.map((folder: any) => ({
        id: folder.id || folder._id,
        name: folder.name,
        color: folder.color,
        reelCount: folder.reelCount || 0,
        isDefault: folder.isDefault || false,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
      }));

      console.log("📁 Mapped Folders:", folders);
      return folders;
    },
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; color?: string }) => {
      const response = await api.post("/api/folders", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
};

export const useUpdateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; color?: string };
    }) => {
      const response = await api.patch(`/api/folders/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/folders/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["reels"] });
    },
  });
};
