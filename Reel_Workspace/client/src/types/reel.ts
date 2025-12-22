export interface Reel {
  id: string;
  url: string;
  thumbnailUrl?: string;
  thumbnail?: string;
  title: string;
  summary: string;
  transcript: string;
  ocrText: string;
  creatorHandle?: string;
  tags: string[];
  folderId?: string;
  folder?: string | null;
  createdAt?: Date | string;
  updatedAt?: string;
  status?: "processing" | "completed" | "error";
  metadata?: Record<string, any>;
  timings?: Record<string, any>;
  actionableChecklist?: string[];
  quizQuestions?: any[];
  quickReferenceCard?: any[];
  learningPath?: string[];
  commonPitfalls?: any[];
  glossary?: any[];
  interactivePromptSuggestions?: string[];
  keyPoints?: string[];
  examples?: string[];
  relatedTopics?: string[];
  detailedExplanation?: string;
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

export type ProcessingStep =
  | "idle"
  | "downloading"
  | "transcribing"
  | "summarizing"
  | "extracting"
  | "completed"
  | "error";
