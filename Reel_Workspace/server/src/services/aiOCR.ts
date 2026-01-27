import Groq from "groq-sdk";
import axios from "axios";
import { OcrError } from "../utils/errors.js";

/**
 * Result from OCR processing
 */
export interface OCRResult {
  text: string;
  confidence?: number;
  rawResponse?: unknown;
}

/**
 * Initialize Groq AI
 */
function initializeGroq(): Groq {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new OcrError("GROQ_API_KEY not configured in environment variables");
  }

  return new Groq({ apiKey });
}

/**
 * Convert image URL to base64
 */
async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    console.log(`[AI OCR] Downloading image from URL...`);
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
    });

    const base64 = Buffer.from(response.data, "binary").toString("base64");
    console.log(`[AI OCR] Image downloaded and converted to base64`);
    return base64;
  } catch (error) {
    throw new OcrError(
      `Failed to download image: ${
        error instanceof Error ? error.message : error
      }`,
    );
  }
}

/**
 * Extract text from image using Groq Vision
 */
export async function extractTextFromImage(
  imageUrl: string,
): Promise<OCRResult> {
  if (!imageUrl || imageUrl.trim().length === 0) {
    console.warn(`[AI OCR] No image URL provided, skipping OCR`);
    return {
      text: "",
      confidence: 0,
    };
  }

  console.log(`[AI OCR] Starting OCR for: ${imageUrl}`);

  try {
    const groq = initializeGroq();
    const modelName =
      process.env.GROQ_VISION_MODEL || "llama-3.2-90b-vision-preview";

    console.log(`[AI OCR] Using Groq Vision model: ${modelName}`);

    // Download and convert image to base64
    const imageBase64 = await imageUrlToBase64(imageUrl);

    // Create the OCR prompt with multilingual support
    const prompt = `Extract all visible text from this image. The text may be in Hindi, English, or mixed languages.

INSTRUCTIONS:
1. Extract all visible text accurately
2. If text is in Hindi (Devanagari script), extract it as-is
3. Then provide English translation
4. Format: "Original: [Hindi text]\nEnglish: [English translation]"
5. If text is already in English, just provide the text
6. If no text is visible, return "No text found"
7. Preserve layout and formatting

Extract the text:`;

    console.log(`[AI OCR] Sending request to Groq Vision...`);

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      model: modelName,
      temperature: 0.1,
      max_completion_tokens: 1024,
      top_p: 1,
    });

    const extractedText = chatCompletion.choices[0]?.message?.content || "";

    console.log(`[AI OCR] Received response from Groq Vision`);

    // Clean up the text
    const cleanedText = extractedText
      .trim()
      .replace(/^["']|["']$/g, "") // Remove quotes
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n");

    const textLength = cleanedText.length;

    console.log(`[AI OCR] OCR complete`);
    console.log(`[AI OCR] Extracted ${textLength} characters`);

    if (textLength > 0 && cleanedText !== "No text found") {
      console.log(`[AI OCR] Preview: ${cleanedText.substring(0, 100)}...`);
    } else {
      console.log(`[AI OCR] No text found in image`);
    }

    return {
      text: cleanedText === "No text found" ? "" : cleanedText,
      confidence: undefined,
      rawResponse: chatCompletion,
    };
  } catch (error: any) {
    // Handle Groq-specific errors
    if (error.message?.includes("API key")) {
      throw new OcrError("Invalid Groq API key");
    }

    if (
      error.message?.includes("quota") ||
      error.message?.includes("rate limit")
    ) {
      throw new OcrError("Groq API quota exceeded. Please try again later.");
    }

    if (error.message?.includes("model")) {
      throw new OcrError(
        `Groq Vision model not available. Try: llama-3.2-11b-vision-preview or llama-3.2-90b-vision-preview`,
      );
    }

    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      throw new OcrError("OCR request timed out");
    }

    if (error instanceof OcrError) {
      throw error;
    }

    throw new OcrError(`OCR failed: ${error.message || error}`);
  }
}

/**
 * Extract text from multiple images with timestamps
 */
export async function extractTextFromImages(
  imageUrls: string[],
): Promise<OCRResult> {
  if (imageUrls.length === 0) {
    return {
      text: "",
      confidence: 0,
    };
  }

  console.log(`[AI OCR] Processing ${imageUrls.length} images`);

  try {
    // Process all images in parallel
    const results = await Promise.all(
      imageUrls.map((imageUrl) => extractTextFromImage(imageUrl)),
    );

    // Combine all text
    const combinedText = results
      .map((result) => result.text)
      .filter((text) => text.length > 0)
      .join("\n\n");

    console.log(`[AI OCR] Combined text from ${results.length} images`);
    console.log(`[AI OCR] Total characters: ${combinedText.length}`);

    return {
      text: combinedText,
      confidence: undefined,
      rawResponse: results.map((r) => r.rawResponse),
    };
  } catch (error) {
    if (error instanceof OcrError) {
      throw error;
    }

    throw new OcrError(
      `Failed to process multiple images: ${
        error instanceof Error ? error.message : error
      }`,
    );
  }
}

/**
 * Extract text from frames with timestamp information
 * OPTIMIZED: Batch processing with concurrency control
 */
export async function extractTextFromFrames(
  frames: Array<{ timestamp: number; imageUrl: string }>,
): Promise<Array<{ timestamp: number; text: string; confidence: number }>> {
  if (frames.length === 0) {
    return [];
  }

  console.log(
    `[AI OCR] Processing ${frames.length} frames with timestamps (optimized batch mode)`,
  );

  try {
    // Process frames with controlled concurrency (1 at a time for speed)
    const BATCH_SIZE = 1; // Process one at a time for fastest response
    const results: Array<{
      timestamp: number;
      text: string;
      confidence: number;
    }> = [];

    for (let i = 0; i < frames.length; i += BATCH_SIZE) {
      const batch = frames.slice(i, i + BATCH_SIZE);
      console.log(
        `[AI OCR] Processing batch ${
          Math.floor(i / BATCH_SIZE) + 1
        }/${Math.ceil(frames.length / BATCH_SIZE)}`,
      );

      const batchResults = await Promise.allSettled(
        batch.map(async (frame) => {
          try {
            const ocrResult = await extractTextFromImage(frame.imageUrl);
            return {
              timestamp: frame.timestamp,
              text: ocrResult.text,
              confidence: ocrResult.confidence || 0.8,
            };
          } catch (error) {
            console.warn(
              `[AI OCR] Failed to process frame at ${frame.timestamp}s, skipping...`,
            );
            return {
              timestamp: frame.timestamp,
              text: "",
              confidence: 0,
            };
          }
        }),
      );

      // Extract successful results
      batchResults.forEach((result) => {
        if (result.status === "fulfilled") {
          results.push(result.value);
        }
      });

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < frames.length) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Reduced from 500ms to 100ms
      }
    }

    const successfulResults = results.filter((r) => r.text.length > 0);
    console.log(
      `[AI OCR] Successfully extracted text from ${successfulResults.length}/${frames.length} frames`,
    );

    return results;
  } catch (error) {
    if (error instanceof OcrError) {
      throw error;
    }

    throw new OcrError(
      `Failed to process frames: ${
        error instanceof Error ? error.message : error
      }`,
    );
  }
}
