import mongoose from "mongoose";
import { Reel } from "../models/Reel.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Migration script to add V2 multimodal fields to existing reels
 *
 * This script:
 * 1. Finds all reels without multimodalMetadata
 * 2. Initializes new fields with default/legacy values
 * 3. Preserves existing data
 * 4. Marks reels as v1.0-legacy for potential re-processing
 */
async function migrateToV2() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/reelworkspace";
    console.log(`Connecting to MongoDB: ${mongoUri}`);

    await mongoose.connect(mongoUri);
    console.log("✓ Connected to MongoDB\n");

    // Find reels without multimodalMetadata
    const reelsToMigrate = await Reel.find({
      multimodalMetadata: { $exists: false },
    });

    console.log(`Found ${reelsToMigrate.length} reels to migrate\n`);

    if (reelsToMigrate.length === 0) {
      console.log("No reels to migrate. All reels are already on V2.");
      await mongoose.disconnect();
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const reel of reelsToMigrate) {
      try {
        // Initialize rawData from existing fields
        reel.rawData = {
          audioTranscript: reel.transcript || "",
          visualTexts: reel.ocrText
            ? [
                {
                  frameTimestamp: 1,
                  text: reel.ocrText,
                  confidence: 0.8,
                },
              ]
            : [],
          instagramCaption: undefined,
          instagramDescription: undefined,
        };

        // Initialize empty visualInsights
        reel.visualInsights = {
          toolsAndPlatforms: {
            type: "tools_platforms",
            category: "Tools & Platforms",
            items: [],
            sourceFrames: [],
            confidence: 0,
          },
          websitesAndUrls: {
            type: "websites_urls",
            category: "Websites & URLs",
            items: [],
            sourceFrames: [],
            confidence: 0,
          },
          brandsAndProducts: {
            type: "brands_products",
            category: "Brands & Products",
            items: [],
            sourceFrames: [],
            confidence: 0,
          },
          listsAndSequences: {
            type: "lists_sequences",
            category: "Lists & Sequences",
            items: [],
            sourceFrames: [],
            confidence: 0,
          },
          numbersAndMetrics: {
            type: "numbers_metrics",
            category: "Numbers & Metrics",
            items: [],
            sourceFrames: [],
            confidence: 0,
          },
          pricesAndCosts: {
            type: "prices_costs",
            category: "Prices & Costs",
            items: [],
            sourceFrames: [],
            confidence: 0,
          },
          recommendations: {
            type: "recommendations",
            category: "Recommendations",
            items: [],
            sourceFrames: [],
            confidence: 0,
          },
        };

        // Initialize multimodalMetadata
        reel.multimodalMetadata = {
          processingVersion: "v1.0-legacy",
          frameCount: reel.ocrText ? 1 : 0,
          ocrFrames: reel.ocrText ? [1] : [],
          hasVisualText: !!reel.ocrText,
          hasAudioTranscript: !!reel.transcript,
          hasMetadata: false,
        };

        await reel.save();
        successCount++;

        if (successCount % 10 === 0) {
          console.log(
            `Migrated ${successCount}/${reelsToMigrate.length} reels...`
          );
        }
      } catch (error) {
        console.error(`Error migrating reel ${reel._id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log("Migration Complete!");
    console.log(`${"=".repeat(60)}`);
    console.log(`✓ Successfully migrated: ${successCount} reels`);
    if (errorCount > 0) {
      console.log(`✗ Failed to migrate: ${errorCount} reels`);
    }
    console.log(`\nAll migrated reels are marked as "v1.0-legacy"`);
    console.log(`You can re-process them later to extract visual insights.`);
    console.log(`${"=".repeat(60)}\n`);

    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateToV2();
