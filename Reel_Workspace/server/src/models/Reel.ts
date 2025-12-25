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
 * Quick Reference Card interface
 */
export interface IQuickReferenceCard {
  facts: string[];
  definitions: string[];
  formulas: string[];
}

/**
 * Common Pitfall interface
 */
export interface ICommonPitfall {
  pitfall: string;
  solution: string;
}

/**
 * Glossary Term interface
 */
export interface IGlossaryTerm {
  term: string;
  definition: string;
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
  quickReferenceCard: IQuickReferenceCard;
  learningPath: string[];
  commonPitfalls: ICommonPitfall[];
  glossary: IGlossaryTerm[];
  interactivePromptSuggestions: string[];
  tags: string[];
  ocrText: string;
  durationSeconds?: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
 * Quick Reference Card Schema
 */
const quickReferenceCardSchema = new Schema<IQuickReferenceCard>(
  {
    facts: { type: [String], default: [] },
    definitions: { type: [String], default: [] },
    formulas: { type: [String], default: [] },
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
 * Glossary Term Schema
 */
const glossaryTermSchema = new Schema<IGlossaryTerm>(
  {
    term: { type: String, required: true },
    definition: { type: String, required: true },
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
    quickReferenceCard: {
      type: quickReferenceCardSchema,
      default: () => ({ facts: [], definitions: [], formulas: [] }),
    },
    learningPath: {
      type: [String],
      default: [],
    },
    commonPitfalls: {
      type: [commonPitfallSchema],
      default: [],
    },
    glossary: {
      type: [glossaryTermSchema],
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
