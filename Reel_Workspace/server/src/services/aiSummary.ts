import Groq from "groq-sdk";
import { SummarizationError } from "../utils/errors.js";

/**
 * Result from AI summarization
 */
export interface SummaryResult {
  summary: string;
  tags: string[];
  suggestedFolder: string;
  rawResponse?: unknown;
}

/**
 * Expected JSON structure from Groq
 */
interface GroqSummaryResponse {
  summary: string;
  tags: string[];
  folder: string;
}

const MAX_TRANSCRIPT_LENGTH = 50000; // Characters
const CHUNK_SIZE = 10000; // Characters per chunk

/**
 * Initialize Groq AI
 */
function initializeGroq(): Groq {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new SummarizationError(
      "GROQ_API_KEY not configured in environment variables"
    );
  }

  return new Groq({ apiKey });
}

/**
 * Normalize and deduplicate tags
 */
function normalizeTags(tags: string[]): string[] {
  const normalized = tags
    .map((tag) => tag.toLowerCase().trim())
    .filter((tag) => tag.length > 0);

  // Deduplicate
  return Array.from(new Set(normalized));
}

/**
 * Parse Groq JSON response
 */
function parseGroqResponse(responseText: string): GroqSummaryResponse {
  try {
    // Try to parse as JSON directly
    const parsed = JSON.parse(responseText);

    // Validate required fields
    if (!parsed.summary || !parsed.tags || !parsed.folder) {
      throw new Error("Missing required fields in response");
    }

    // Ensure tags is an array
    if (!Array.isArray(parsed.tags)) {
      throw new Error("Tags must be an array");
    }

    return {
      summary: String(parsed.summary),
      tags: parsed.tags.map((tag: any) => String(tag)),
      folder: String(parsed.folder),
    };
  } catch (error) {
    console.error(`[AI Summary] Failed to parse response:`, responseText);
    throw new SummarizationError(
      `Failed to parse Groq response: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}

/**
 * Summarize transcript using Groq AI
 */
export async function summarizeWithGroq(
  transcript: string
): Promise<SummaryResult> {
  if (!transcript || transcript.trim().length === 0) {
    throw new SummarizationError("Transcript is empty");
  }

  if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
    throw new SummarizationError(
      `Transcript too long: ${transcript.length} characters (max ${MAX_TRANSCRIPT_LENGTH})`
    );
  }

  try {
    const groq = initializeGroq();
    const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    console.log(`[AI Summary] Using Groq model: ${modelName}`);

    let processedTranscript = transcript;

    // Handle very long transcripts by truncating (Groq has context limits)
    if (transcript.length > CHUNK_SIZE) {
      console.log(
        `[AI Summary] Transcript is long, truncating to ${CHUNK_SIZE} characters`
      );
      processedTranscript = transcript.substring(0, CHUNK_SIZE);
    }

    // Create the main prompt
    const prompt = `Analyze the following transcript and provide a response in STRICT JSON format with these exact fields:

{
  "summary": "A concise 3-5 sentence summary of the main content",
  "tags": ["3-7 short, lowercase keywords"],
  "folder": "A short, human-readable category name (e.g., 'education', 'entertainment', 'tutorial')"
}

Rules:
- Return ONLY valid JSON, no markdown, no explanations
- Summary must be 3-5 sentences
- Tags must be 3-7 lowercase keywords
- Folder must be a single short category name
- All fields are required

Transcript:
${processedTranscript}`;

    console.log(`[AI Summary] Sending request to Groq...`);

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: modelName,
      temperature: 0.7,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "";

    console.log(`[AI Summary] Received response, parsing...`);

    // Parse the JSON response
    const parsed = parseGroqResponse(responseText);

    // Normalize tags
    const normalizedTags = normalizeTags(parsed.tags);

    // Validate tag count
    if (normalizedTags.length < 3) {
      console.warn(
        `[AI Summary] Only ${normalizedTags.length} tags generated, expected 3-7`
      );
    }

    console.log(`[AI Summary] Summarization complete`);
    console.log(`[AI Summary] Summary: ${parsed.summary.substring(0, 100)}...`);
    console.log(`[AI Summary] Tags: ${normalizedTags.join(", ")}`);
    console.log(`[AI Summary] Folder: ${parsed.folder}`);

    return {
      summary: parsed.summary,
      tags: normalizedTags,
      suggestedFolder: parsed.folder,
      rawResponse: chatCompletion,
    };
  } catch (error: any) {
    // Handle Groq-specific errors
    if (error.message?.includes("API key")) {
      throw new SummarizationError("Invalid Groq API key");
    }

    if (
      error.message?.includes("quota") ||
      error.message?.includes("rate limit")
    ) {
      throw new SummarizationError(
        "Groq API quota exceeded. Please try again later."
      );
    }

    if (error instanceof SummarizationError) {
      throw error;
    }

    throw new SummarizationError(
      `Summarization failed: ${error.message || error}`
    );
  }
}
