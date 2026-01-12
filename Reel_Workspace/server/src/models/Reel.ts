import mongoose, { Document, Schema } from "mongoose";

/**
 * Quiz Question interface
 */
export interface IQuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

/**
 * Common Pitfall interface
 */
export interface ICommonPitfall {
  pitfall: string;
  solution: string;
}

/**
 * Visual text from frame
 */
export interface IVisualText {
  frameTimestamp: number;
  text: string;
  confidence: number;
}

/**
 * Raw multimodal data
 */
export interface IRawData {
  audioTranscript: string;
  visualTexts: IVisualText[];
  instagramCaption?: string;
  instagramDescription?: string;
}

/**
 * Visual insight item
 */
export interface IInsightItem {
  value: string;
  context?: string;
  metadata?: {
    price?: string;
    url?: string;
    description?: string;
  };
}

/**
 * Visual insight category
 */
export interface IVisualInsight {
  type: string;
  category: string;
  items: IInsightItem[];
  sourceFrames?: number[];
  confidence: number;
}

/**
 * Multimodal metadata
 */
export interface IMultimodalMetadata {
  processingVersion: string;
  frameCount: number;
  ocrFrames: number[];
  hasVisualText: boolean;
  hasAudioTranscript: boolean;
  hasMetadata: boolean;
}

/**
 * Reel interface for TypeScript
 */
export interface IReel extends Document {
  userId: mongoose.Types.ObjectId;
  folderId: mongoose.Types.ObjectId;
  sourceUrl: string;
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  transcript: string;
  summary: string;
  detailedExplanation: string;
  keyPoints: string[];
  examples: string[];
  relatedTopics: string[];
  actionableChecklist: string[];
  quizQuestions: IQuizQuestion[];
  learningPath: string[];
  commonPitfalls: ICommonPitfall[];
  interactivePromptSuggestions: string[];
  tags: string[];
  ocrText: string;
  durationSeconds?: number;
  isDeleted: boolean;

  // NEW: Multimodal fields
  rawData?: IRawData;
  visualInsights?: {
    toolsAndPlatforms?: IVisualInsight;
    websitesAndUrls?: IVisualInsight;
    brandsAndProducts?: IVisualInsight;
    listsAndSequences?: IVisualInsight;
    numbersAndMetrics?: IVisualInsight;
    pricesAndCosts?: IVisualInsight;
    recommendations?: IVisualInsight;
  };
  multimodalMetadata?: IMultimodalMetadata;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Visual text schema
 */
const visualTextSchema = new Schema<IVisualText>(
  {
    frameTimestamp: { type: Number, required: true },
    text: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
);

/**
 * Raw data schema
 */
const rawDataSchema = new Schema<IRawData>(
  {
    audioTranscript: { type: String, default: "" },
    visualTexts: { type: [visualTextSchema], default: [] },
    instagramCaption: { type: String },
    instagramDescription: { type: String },
  },
  { _id: false }
);

/**
 * Insight item schema
 */
const insightItemSchema = new Schema<IInsightItem>(
  {
    value: { type: String, required: true },
    context: { type: String },
    metadata: {
      type: {
        price: String,
        url: String,
        description: String,
      },
      default: undefined,
    },
  },
  { _id: false }
);

/**
 * Visual insight schema
 */
const visualInsightSchema = new Schema<IVisualInsight>(
  {
    type: { type: String, required: true },
    category: { type: String, required: true },
    items: { type: [insightItemSchema], default: [] },
    sourceFrames: { type: [Number], default: [] },
    confidence: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
);

/**
 * Multimodal metadata schema
 */
const multimodalMetadataSchema = new Schema<IMultimodalMetadata>(
  {
    processingVersion: { type: String, required: true },
    frameCount: { type: Number, required: true },
    ocrFrames: { type: [Number], default: [] },
    hasVisualText: { type: Boolean, required: true },
    hasAudioTranscript: { type: Boolean, required: true },
    hasMetadata: { type: Boolean, required: true },
  },
  { _id: false }
);

/**
 * Quiz Question Schema
 */
const quizQuestionSchema = new Schema<IQuizQuestion>(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

/**
 * Common Pitfall Schema
 */
const commonPitfallSchema = new Schema<ICommonPitfall>(
  {
    pitfall: { type: String, required: true },
    solution: { type: String, required: true },
  },
  { _id: false }
);

/**
 * Reel Schema Definition
 */
const reelSchema = new Schema<IReel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    folderId: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      required: [true, "Folder ID is required"],
      index: true,
    },
    sourceUrl: {
      type: String,
      required: [true, "Source URL is required"],
      index: true,
    },
    videoUrl: {
      type: String,
      required: [true, "Video URL is required"],
    },
    thumbnailUrl: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    transcript: {
      type: String,
      default: "",
    },
    summary: {
      type: String,
      default: "",
    },
    detailedExplanation: {
      type: String,
      default: "",
    },
    keyPoints: {
      type: [String],
      default: [],
    },
    examples: {
      type: [String],
      default: [],
    },
    relatedTopics: {
      type: [String],
      default: [],
    },
    actionableChecklist: {
      type: [String],
      default: [],
    },
    quizQuestions: {
      type: [quizQuestionSchema],
      default: [],
    },
    learningPath: {
      type: [String],
      default: [],
    },
    commonPitfalls: {
      type: [commonPitfallSchema],
      default: [],
    },
    interactivePromptSuggestions: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    ocrText: {
      type: String,
      default: "",
    },
    durationSeconds: {
      type: Number,
      min: [0, "Duration cannot be negative"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // NEW: Multimodal fields
    rawData: {
      type: rawDataSchema,
      default: undefined,
    },
    visualInsights: {
      type: {
        toolsAndPlatforms: visualInsightSchema,
        websitesAndUrls: visualInsightSchema,
        brandsAndProducts: visualInsightSchema,
        listsAndSequences: visualInsightSchema,
        numbersAndMetrics: visualInsightSchema,
        pricesAndCosts: visualInsightSchema,
        recommendations: visualInsightSchema,
      },
      default: undefined,
    },
    multimodalMetadata: {
      type: multimodalMetadataSchema,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
reelSchema.index({ userId: 1, createdAt: -1 });
reelSchema.index({ userId: 1, folderId: 1 });
reelSchema.index({ userId: 1, isDeleted: 1 });
// Compound unique index: Each user can have their own copy of the same reel URL
// Partial index only enforces uniqueness on non-deleted reels
reelSchema.index(
  { userId: 1, sourceUrl: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Text search index for search functionality
reelSchema.index({
  title: "text",
  summary: "text",
  transcript: "text",
  ocrText: "text",
  detailedExplanation: "text",
});

/**
 * Transform toJSON to clean up response
 */
reelSchema.set("toJSON", {
  transform: (doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

/**
 * Reel Model
 */
export const Reel = mongoose.model<IReel>("Reel", reelSchema);
