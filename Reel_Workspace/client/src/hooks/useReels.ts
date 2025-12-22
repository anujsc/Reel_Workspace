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

      // Add folder filter if provided (use 'folderId' as backend expects)
      if (folder && folder !== "uncategorized") {
        queryParams.append("folderId", folder);
      }

      console.log("🎬 Fetching reels with params:", queryParams.toString());

      const response = await api.get(`/api/reel?${queryParams.toString()}`);
      console.log("🎬 Reels API Response:", response.data);

      // Backend returns: { success, data: [reels array], meta: { total } }
      // Map backend fields to frontend types
      const reels = response.data.data.map((reel: any) => ({
        id: reel._id,
        url: reel.sourceUrl,
        title: reel.title,
        summary: reel.summary,
        transcript: reel.transcript,
        ocrText: reel.ocrText,
        tags: reel.tags || [],
        folder: reel.folderId?.name || null,
        folderId: reel.folderId?._id || null,
        thumbnail: reel.thumbnailUrl,
        metadata: reel.metadata || {},
        timings: reel.timings || {},
        actionableChecklist: reel.actionableChecklist || [],
        quizQuestions: (reel.quizQuestions || []).map((q: any) => ({
          question: q.question,
          options: q.options,
          correctAnswer:
            typeof q.answer === "string" ? 0 : q.correctAnswer || 0,
          explanation: q.explanation || q.answer || "",
        })),
        quickReferenceCard: reel.quickReferenceCard?.facts
          ? reel.quickReferenceCard.facts.map((fact: string) => ({
              title: "Fact",
              content: fact,
            }))
          : [],
        learningPath: reel.learningPath || [],
        commonPitfalls: reel.commonPitfalls || [],
        glossary: reel.glossary || [],
        interactivePromptSuggestions: reel.interactivePromptSuggestions || [],
        keyPoints: reel.keyPoints || [],
        examples: reel.examples || [],
        relatedTopics: reel.relatedTopics || [],
        detailedExplanation: reel.detailedExplanation || "",
        createdAt: reel.createdAt,
        updatedAt: reel.updatedAt,
      }));

      // Filter for uncategorized on frontend if needed
      let filteredReels = reels;
      if (folder === "uncategorized") {
        filteredReels = reels.filter((reel: any) => !reel.folderId);
        console.log("🎬 Filtered uncategorized reels:", filteredReels.length);
      }

      console.log("🎬 Total reels returned:", filteredReels.length);

      return {
        reels: filteredReels,
        total:
          folder === "uncategorized"
            ? filteredReels.length
            : response.data.meta?.total || 0,
      };
    },
  });
};
