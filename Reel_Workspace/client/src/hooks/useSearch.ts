import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import { Reel } from "../lib/types";

interface SearchFilters {
  tags?: string[];
  folders?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
}

interface UseSearchParams {
  query: string;
  filters?: SearchFilters;
}

interface SearchResponse {
  reels: Reel[];
  total: number;
  query: string;
}

export const useSearch = ({ query, filters }: UseSearchParams) => {
  return useQuery({
    queryKey: ["search", query, filters],
    queryFn: async (): Promise<SearchResponse> => {
      // Don't search if query is empty
      if (!query || query.trim().length === 0) {
        return { reels: [], total: 0, query: "" };
      }

      const queryParams = new URLSearchParams({
        q: query.trim(),
      });

      // Add filters if provided
      if (filters?.tags && filters.tags.length > 0) {
        queryParams.append("tags", filters.tags.join(","));
      }

      if (filters?.folders && filters.folders.length > 0) {
        queryParams.append("folders", filters.folders.join(","));
      }

      if (filters?.dateRange?.start) {
        queryParams.append("startDate", filters.dateRange.start);
      }

      if (filters?.dateRange?.end) {
        queryParams.append("endDate", filters.dateRange.end);
      }

      console.log("🔍 Search API call:", queryParams.toString());

      const response = await api.get(`/api/search?${queryParams.toString()}`);

      console.log("🔍 Search API response:", response.data);

      // Map backend response to frontend types
      const reels = (response.data.data || []).map((reel: any) => ({
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

      return {
        reels,
        total: response.data.meta?.total || reels.length,
        query: query.trim(),
      };
    },
    enabled: query.trim().length > 0, // Only run query if there's a search term
  });
};
