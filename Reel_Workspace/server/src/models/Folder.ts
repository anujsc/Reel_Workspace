import mongoose, { Document, Schema } from "mongoose";

/**
 * Folder interface for TypeScript
 */
export interface IFolder extends Document {
  name: string;
  color: string;
  userId: mongoose.Types.ObjectId;
  reelCount: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Folder Schema Definition
 */
const folderSchema = new Schema<IFolder>(
  {
    name: {
      type: String,
      required: [true, "Folder name is required"],
      trim: true,
      maxlength: [50, "Folder name cannot exceed 50 characters"],
    },
    color: {
      type: String,
      default: "#3B82F6", // Default blue color
      match: [/^#[0-9A-F]{6}$/i, "Please provide a valid hex color code"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    reelCount: {
      type: Number,
      default: 0,
      min: [0, "Reel count cannot be negative"],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique folder names per user
folderSchema.index({ userId: 1, name: 1 }, { unique: true });

/**
 * Transform toJSON to clean up response
 */
folderSchema.set("toJSON", {
  transform: (doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

/**
 * Folder Model
 */
export const Folder = mongoose.model<IFolder>("Folder", folderSchema);
