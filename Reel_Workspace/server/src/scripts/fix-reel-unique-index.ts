/**
 * Migration Script: Fix Reel sourceUrl Unique Index
 *
 * Problem: The sourceUrl field had a global unique constraint, preventing
 * multiple users from extracting the same Instagram reel.
 *
 * Solution: Drop the global unique index and create a compound unique index
 * on (userId, sourceUrl) so each user can have their own copy of the same reel.
 *
 * Usage: npx tsx src/scripts/fix-reel-unique-index.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/reelmind";

async function fixReelUniqueIndex() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db!;
    const reelsCollection = db.collection("reels");

    console.log("\n📋 Current indexes:");
    const currentIndexes = await reelsCollection.indexes();
    currentIndexes.forEach((index) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Check if the old unique index exists
    const hasOldUniqueIndex = currentIndexes.some(
      (index) => index.name === "sourceUrl_1" && index.unique === true
    );

    if (hasOldUniqueIndex) {
      console.log("\n🗑️  Dropping old unique index on sourceUrl...");
      await reelsCollection.dropIndex("sourceUrl_1");
      console.log("✅ Old unique index dropped");
    } else {
      console.log(
        "\n⚠️  Old unique index not found (may have been already removed)"
      );
    }

    // Check if the new compound unique index exists
    const hasNewCompoundIndex = currentIndexes.some(
      (index) =>
        index.name === "userId_1_sourceUrl_1" &&
        index.unique === true &&
        index.key.userId === 1 &&
        index.key.sourceUrl === 1
    );

    if (!hasNewCompoundIndex) {
      console.log(
        "\n🔨 Creating new compound unique index on (userId, sourceUrl)..."
      );
      await reelsCollection.createIndex(
        { userId: 1, sourceUrl: 1 },
        { unique: true, name: "userId_1_sourceUrl_1" }
      );
      console.log("✅ New compound unique index created");
    } else {
      console.log("\n✅ Compound unique index already exists");
    }

    console.log("\n📋 Updated indexes:");
    const updatedIndexes = await reelsCollection.indexes();
    updatedIndexes.forEach((index) => {
      console.log(
        `  - ${index.name}:`,
        JSON.stringify(index.key),
        index.unique ? "(unique)" : ""
      );
    });

    console.log("\n✅ Migration completed successfully!");
    console.log("\n📝 Summary:");
    console.log("  - Removed global unique constraint on sourceUrl");
    console.log("  - Added compound unique index on (userId, sourceUrl)");
    console.log("  - Multiple users can now extract the same reel URL");
    console.log("  - Each user can only have one copy of each reel URL");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the migration
fixReelUniqueIndex();
