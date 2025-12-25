import mongoose, { Document, Schema } from "mongoose";

/**
 * Folder Share interface for TypeScript
 */
export interface IFolderShare extends Document {
  folderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  shareToken: string;
  expiresAt?: Date;
  isActive: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Folder Share Schema Definition
 */
const folderShareSchema = new Schema<IFolderShare>(
  {
    folderId: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      required: [true, "Folder ID is required"],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    shareToken: {
      type: String,
      required: [true, "Share token is required"],
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: [0, "View count cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
folderShareSchema.index({ folderId: 1, userId: 1 });
folderShareSchema.index({ shareToken: 1, isActive: 1 });

/**
 * Transform toJSON to clean up response
 */
folderShareSchema.set("toJSON", {
  transform: (doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

/**
 * Folder Share Model
 */
export const FolderShare = mongoose.model<IFolderShare>(
  "FolderShare",
  folderShareSchema
);
