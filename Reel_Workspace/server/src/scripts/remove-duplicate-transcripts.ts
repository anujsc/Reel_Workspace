import mongoose from "mongoose";
import { Reel } from "../models/Reel.js";
import { connectDB, disconnectDB } from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Remove duplicate audioTranscript from rawData
 * Since transcript field already contains the same data
 */
async function removeDuplicateTranscripts() {
  try {
    await connectDB();
    console.log("\n🔧 Removing Duplicate Transcript Data...\n");

    // Find reels with rawData.audioTranscript
    const reelsWithDuplicates = await Reel.find({
      "rawData.audioTranscript": { $exists: true, $ne: "" },
      isDeleted: false,
    }).select("_id title transcript rawData.audioTranscript");

    if (reelsWithDuplicates.length === 0) {
      console.log("✅ No duplicate transcripts found. Nothing to do.");
      return;
    }

    console.log(
      `Found ${reelsWithDuplicates.length} reels with rawData.audioTranscript\n`,
    );

    let duplicateCount = 0;
    let savedBytes = 0;

    // Check which ones are actual duplicates
    for (const reel of reelsWithDuplicates) {
      if (reel.transcript === reel.rawData?.audioTranscript) {
        duplicateCount++;
        savedBytes += Buffer.byteLength(reel.transcript, "utf8");
      }
    }

    console.log(`📊 Analysis:`);
    console.log(
      `   Total reels with rawData.audioTranscript: ${reelsWithDuplicates.length}`,
    );
    console.log(`   Actual duplicates: ${duplicateCount}`);
    console.log(
      `   Space to save: ${(savedBytes / 1024).toFixed(2)} KB (${(savedBytes / 1024 / 1024).toFixed(2)} MB)\n`,
    );

    if (duplicateCount === 0) {
      console.log("✅ No duplicate transcripts found. Nothing to do.");
      return;
    }

    // Ask for confirmation (in production, you might want to skip this)
    console.log("⚠️  This will remove rawData.audioTranscript from all reels");
    console.log("   The transcript field will remain unchanged\n");

    // Perform the update
    console.log("🔄 Removing duplicate transcripts...");

    const result = await Reel.updateMany(
      {
        "rawData.audioTranscript": { $exists: true },
        isDeleted: false,
      },
      {
        $unset: { "rawData.audioTranscript": "" },
      },
    );

    console.log(`\n✅ Migration complete!`);
    console.log(`   Modified: ${result.modifiedCount} documents`);
    console.log(
      `   Space saved: ${(savedBytes / 1024).toFixed(2)} KB (${(savedBytes / 1024 / 1024).toFixed(2)} MB)`,
    );
    console.log(
      `   Memory reduction: ~${((savedBytes * 3) / 1024 / 1024).toFixed(2)} MB (with Mongoose overhead)\n`,
    );

    // Verify
    const remaining = await Reel.countDocuments({
      "rawData.audioTranscript": { $exists: true, $ne: "" },
      isDeleted: false,
    });

    if (remaining === 0) {
      console.log(
        "✅ Verification: All duplicate transcripts removed successfully!\n",
      );
    } else {
      console.log(
        `⚠️  Warning: ${remaining} documents still have rawData.audioTranscript\n`,
      );
    }
  } catch (error) {
    console.error("❌ Error during migration:", error);
  } finally {
    await disconnectDB();
  }
}

// Run migration
removeDuplicateTranscripts();
