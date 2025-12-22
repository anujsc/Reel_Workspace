export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuickReferenceCard {
  title: string;
  content: string;
  category?: string;
}

export interface CommonPitfall {
  pitfall: string;
  solution: string;
  severity?: "low" | "medium" | "high";
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  relatedTerms?: string[];
}

export interface Reel {
  id: string;
  url: string;
  title: string;
  summary: string;
  transcript: string;
  ocrText: string;
  tags: string[];
  folder: string | null;
  folderId: string | null;
  thumbnail: string;
  thumbnailUrl?: string;
  creatorHandle?: string;
  status?: "processing" | "completed" | "error";
  metadata: Record<string, any>;
  timings: Record<string, any>;
  actionableChecklist: string[];
  quizQuestions: QuizQuestion[];
  quickReferenceCard: QuickReferenceCard[];
  learningPath: string[];
  commonPitfalls: CommonPitfall[];
  glossary: GlossaryTerm[];
  interactivePromptSuggestions: string[];
  keyPoints: string[];
  examples: string[];
  relatedTopics: string[];
  detailedExplanation: string;
  createdAt?: string | Date;
  updatedAt?: string;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  reelCount: number;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
