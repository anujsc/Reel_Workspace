export interface Reel {
  id: string;
  url?: string;
  sourceUrl?: string;
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

  // NEW: Multimodal fields
  rawData?: {
    audioTranscript: string;
    visualTexts: Array<{
      frameTimestamp: number;
      text: string;
      confidence: number;
    }>;
    instagramCaption?: string;
    instagramDescription?: string;
  };
  visualInsights?: {
    toolsAndPlatforms?: VisualInsight;
    websitesAndUrls?: VisualInsight;
    brandsAndProducts?: VisualInsight;
    listsAndSequences?: VisualInsight;
    numbersAndMetrics?: VisualInsight;
    pricesAndCosts?: VisualInsight;
    recommendations?: VisualInsight;
  };
  multimodalMetadata?: {
    processingVersion: string;
    frameCount: number;
    ocrFrames: number[];
    hasVisualText: boolean;
    hasAudioTranscript: boolean;
    hasMetadata: boolean;
  };
}

export interface VisualInsight {
  type: string;
  category: string;
  items: InsightItem[];
  sourceFrames?: number[];
  confidence: number;
}

export interface InsightItem {
  value: string;
  context?: string;
  metadata?: {
    price?: string;
    url?: string;
    description?: string;
  };
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  reelCount: number;
  isDefault?: boolean;
  emoji?: string;
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
