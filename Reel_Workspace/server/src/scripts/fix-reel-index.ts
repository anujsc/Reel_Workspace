import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Migration script to fix the unique index on Reel collection
 * This allows users to re-extract deleted reels
 */
async function fixReelIndex() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("Connected successfully");

    const db = mongoose.connection.db;
    const reelsCollection = db.collection("reels");

    // Drop the old unique index
    console.log("Dropping old unique index on (userId, sourceUrl)...");
    try {
      await reelsCollection.dropIndex("userId_1_sourceUrl_1");
      console.log("Old index dropped successfully");
    } catch (error: any) {
      if (error.code === 27) {
        console.log("Index doesn't exist, skipping drop");
      } else {
        throw error;
      }
    }

    // Create new partial unique index
    console.log("Creating new partial unique index...");
    await reelsCollection.createIndex(
      { userId: 1, sourceUrl: 1 },
      {
        unique: true,
        partialFilterExpression: { isDeleted: false },
        name: "userId_1_sourceUrl_1",
      }
    );
    console.log("New partial unique index created successfully");

    console.log("\n✅ Migration completed successfully!");
    console.log("Users can now re-extract deleted reels.");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the migration
fixReelIndex();
