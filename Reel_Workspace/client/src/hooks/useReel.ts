import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import { Reel } from "../lib/types";

export const useReel = (id: string | undefined) => {
  return useQuery({
    queryKey: ["reel", id],
    queryFn: async (): Promise<Reel> => {
      const response = await api.get(`/api/reel/${id}`);
      const reel = response.data.data;
      // Map backend fields to frontend types
      return {
        id: reel.id || reel._id,
        url: reel.sourceUrl,
        title: reel.title,
        summary: reel.summary,
        transcript: reel.transcript,
        ocrText: reel.ocrText,
        tags: reel.tags || [],
        folder: reel.folderId?.name || null,
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
        commonPitfalls: (reel.commonPitfalls || []).map((p: any) => ({
          pitfall: p.pitfall,
          solution: p.solution,
          severity: p.severity,
        })),
        glossary: (reel.glossary || []).map((g: any) => ({
          term: g.term,
          definition: g.definition,
          relatedTerms: g.relatedTerms,
        })),
        interactivePromptSuggestions: reel.interactivePromptSuggestions || [],
        keyPoints: reel.keyPoints || [],
        examples: reel.examples || [],
        relatedTopics: reel.relatedTopics || [],
        detailedExplanation: reel.detailedExplanation || "",
        createdAt: reel.createdAt,
        updatedAt: reel.updatedAt,
      };
    },
    enabled: !!id,
  });
};
