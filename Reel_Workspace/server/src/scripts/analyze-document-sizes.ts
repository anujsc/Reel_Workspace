import mongoose from "mongoose";
import { Reel } from "../models/Reel.js";
import { connectDB, disconnectDB } from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Analyze Reel document sizes to identify memory issues
 */
async function analyzeDocumentSizes() {
  try {
    await connectDB();
    console.log("\n📊 Analyzing Reel Document Sizes...\n");

    // Get all reels
    const reels = await Reel.find({ isDeleted: false }).lean();

    if (reels.length === 0) {
      console.log("No reels found in database.");
      return;
    }

    console.log(`Total reels: ${reels.length}\n`);

    // Analyze each reel
    const sizes: number[] = [];
    let totalSize = 0;
    let maxSize = 0;
    let maxSizeReel: any = null;

    for (const reel of reels) {
      const jsonStr = JSON.stringify(reel);
      const sizeKB = Buffer.byteLength(jsonStr, "utf8") / 1024;
      sizes.push(sizeKB);
      totalSize += sizeKB;

      if (sizeKB > maxSize) {
        maxSize = sizeKB;
        maxSizeReel = reel;
      }
    }

    // Calculate statistics
    const avgSize = totalSize / reels.length;
    const sortedSizes = sizes.sort((a, b) => b - a);
    const medianSize = sortedSizes[Math.floor(sortedSizes.length / 2)];

    console.log("📈 Size Statistics:");
    console.log(`   Average: ${avgSize.toFixed(2)} KB`);
    console.log(`   Median: ${medianSize.toFixed(2)} KB`);
    console.log(`   Max: ${maxSize.toFixed(2)} KB`);
    console.log(`   Min: ${sortedSizes[sortedSizes.length - 1].toFixed(2)} KB`);
    console.log(
      `   Total: ${totalSize.toFixed(2)} KB (${(totalSize / 1024).toFixed(2)} MB)\n`,
    );

    // Analyze largest document
    if (maxSizeReel) {
      console.log("🔍 Largest Document Analysis:");
      console.log(`   ID: ${maxSizeReel._id}`);
      console.log(`   Title: ${maxSizeReel.title}`);
      console.log(`   Total Size: ${maxSize.toFixed(2)} KB\n`);

      // Analyze field sizes
      const fieldSizes: { field: string; size: number }[] = [];

      for (const [key, value] of Object.entries(maxSizeReel)) {
        if (value !== null && value !== undefined) {
          const fieldStr = JSON.stringify(value);
          const fieldSizeKB = Buffer.byteLength(fieldStr, "utf8") / 1024;
          if (fieldSizeKB > 0.5) {
            // Only show fields > 0.5KB
            fieldSizes.push({ field: key, size: fieldSizeKB });
          }
        }
      }

      fieldSizes.sort((a, b) => b.size - a.size);

      console.log("   Field Sizes (> 0.5 KB):");
      for (const { field, size } of fieldSizes.slice(0, 15)) {
        const percentage = ((size / maxSize) * 100).toFixed(1);
        console.log(`   - ${field}: ${size.toFixed(2)} KB (${percentage}%)`);
      }
    }

    // Check for duplicate transcript data
    console.log("\n🔍 Checking for Duplicate Transcript Data:");
    let duplicateCount = 0;
    let duplicateSize = 0;

    for (const reel of reels) {
      if (reel.transcript && reel.rawData?.audioTranscript) {
        if (reel.transcript === reel.rawData.audioTranscript) {
          duplicateCount++;
          const transcriptSize =
            Buffer.byteLength(reel.transcript, "utf8") / 1024;
          duplicateSize += transcriptSize;
        }
      }
    }

    if (duplicateCount > 0) {
      console.log(
        `   ⚠️  Found ${duplicateCount} reels with duplicate transcripts`,
      );
      console.log(
        `   💾 Wasted space: ${duplicateSize.toFixed(2)} KB (${(duplicateSize / 1024).toFixed(2)} MB)`,
      );
      console.log(
        `   💡 Recommendation: Remove rawData.audioTranscript field\n`,
      );
    } else {
      console.log(`   ✅ No duplicate transcripts found\n`);
    }

    // Memory impact estimation
    console.log("💾 Memory Impact Estimation:");
    console.log(`   Loading 20 reels: ${(avgSize * 20).toFixed(2)} KB`);
    console.log(
      `   With Mongoose overhead (3x): ${(avgSize * 20 * 3).toFixed(2)} KB`,
    );
    console.log(
      `   Loading 100 reels: ${((avgSize * 100) / 1024).toFixed(2)} MB`,
    );
    console.log(
      `   With Mongoose overhead (3x): ${((avgSize * 100 * 3) / 1024).toFixed(2)} MB\n`,
    );

    // Recommendations
    console.log("💡 Recommendations:");
    if (avgSize > 50) {
      console.log("   ⚠️  Average document size is HIGH (> 50 KB)");
      console.log("   - Use .select() to limit fields in queries");
      console.log("   - Use .lean() to avoid Mongoose overhead");
      console.log("   - Consider removing duplicate data");
    }
    if (maxSize > 100) {
      console.log("   ⚠️  Maximum document size is VERY HIGH (> 100 KB)");
      console.log("   - Add maxlength validators to text fields");
      console.log("   - Truncate large fields during processing");
    }
    if (duplicateCount > 0) {
      console.log("   ⚠️  Duplicate transcript data found");
      console.log("   - Run migration to remove rawData.audioTranscript");
    }

    console.log("\n✅ Analysis complete!\n");
  } catch (error) {
    console.error("❌ Error analyzing documents:", error);
  } finally {
    await disconnectDB();
  }
}

// Run analysis
analyzeDocumentSizes();
