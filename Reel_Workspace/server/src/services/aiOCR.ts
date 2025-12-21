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
      }`
    );
  }
}

/**
 * Extract text from image using Groq Vision
 */
export async function extractTextFromImage(
  imageUrl: string
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

    // Create the OCR prompt
    const prompt = `Extract all visible text from this image. 
    
Rules:
- Return ONLY the extracted text, nothing else
- Preserve the original text layout and formatting
- If no text is visible, return "No text found"
- Do not add explanations or descriptions`;

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
        `Groq Vision model not available. Try: llama-3.2-11b-vision-preview or llama-3.2-90b-vision-preview`
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
 * Extract text from multiple images
 */
export async function extractTextFromImages(
  imageUrls: string[]
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
      imageUrls.map((imageUrl) => extractTextFromImage(imageUrl))
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
      }`
    );
  }
}
