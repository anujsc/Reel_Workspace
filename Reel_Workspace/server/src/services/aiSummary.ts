import { GoogleGenerativeAI } from "@google/generative-ai";
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
 * Expected JSON structure from Gemini
 */
interface GeminiSummaryResponse {
  summary: string;
  tags: string[];
  folder: string;
}

const MAX_TRANSCRIPT_LENGTH = 50000; // Characters
const CHUNK_SIZE = 10000; // Characters per chunk

/**
 * Initialize Gemini AI
 */
function initializeGemini(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new SummarizationError(
      "GEMINI_API_KEY not configured in environment variables"
    );
  }

  return new GoogleGenerativeAI(apiKey);
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
 * Parse JSON response from Gemini
 */
function parseGeminiResponse(text: string): GeminiSummaryResponse {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;

    const parsed = JSON.parse(jsonText);

    // Validate required fields
    if (!parsed.summary || typeof parsed.summary !== "string") {
      throw new Error("Missing or invalid 'summary' field");
    }

    if (!Array.isArray(parsed.tags)) {
      throw new Error("Missing or invalid 'tags' field");
    }

    if (!parsed.folder || typeof parsed.folder !== "string") {
      throw new Error("Missing or invalid 'folder' field");
    }

    return parsed as GeminiSummaryResponse;
  } catch (error) {
    throw new SummarizationError(
      `Failed to parse Gemini response as JSON: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}

/**
 * Chunk long transcript for processing
 */
function chunkTranscript(transcript: string): string[] {
  if (transcript.length <= CHUNK_SIZE) {
    return [transcript];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < transcript.length) {
    let end = start + CHUNK_SIZE;

    // Try to break at sentence boundary
    if (end < transcript.length) {
      const lastPeriod = transcript.lastIndexOf(".", end);
      const lastQuestion = transcript.lastIndexOf("?", end);
      const lastExclamation = transcript.lastIndexOf("!", end);

      const breakPoint = Math.max(lastPeriod, lastQuestion, lastExclamation);

      if (breakPoint > start) {
        end = breakPoint + 1;
      }
    }

    chunks.push(transcript.substring(start, end).trim());
    start = end;
  }

  return chunks;
}

/**
 * Summarize a single chunk
 */
async function summarizeChunk(
  model: any,
  chunk: string,
  isPartial: boolean = false
): Promise<string> {
  const prompt = isPartial
    ? `Summarize the following text segment in 2-3 sentences:\n\n${chunk}`
    : `Summarize the following text in 3-5 sentences:\n\n${chunk}`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Summarize transcript using Google Gemini
 */
export async function summarizeTranscriptWithGemini(
  transcript: string
): Promise<SummaryResult> {
  console.log(
    `[AI Summary] Starting summarization (${transcript.length} characters)`
  );

  if (!transcript || transcript.trim().length === 0) {
    throw new SummarizationError("Transcript is empty");
  }

  if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
    throw new SummarizationError(
      `Transcript too long: ${transcript.length} characters (max ${MAX_TRANSCRIPT_LENGTH})`
    );
  }

  try {
    const genAI = initializeGemini();
    // Use Gemini Pro for summarization
    const model = genAI.getGenerativeModel({
     model: "gemini-2.5-flash"  // or "gemini-2.5-flash"

    });

    let processedTranscript = transcript;

    // Handle very long transcripts by chunking
    if (transcript.length > CHUNK_SIZE) {
      console.log(`[AI Summary] Transcript is long, chunking...`);
      const chunks = chunkTranscript(transcript);
      console.log(`[AI Summary] Processing ${chunks.length} chunks`);

      const chunkSummaries = await Promise.all(
        chunks.map((chunk, index) => {
          console.log(
            `[AI Summary] Summarizing chunk ${index + 1}/${chunks.length}`
          );
          return summarizeChunk(model, chunk, true);
        })
      );

      processedTranscript = chunkSummaries.join(" ");
      console.log(
        `[AI Summary] Combined chunk summaries: ${processedTranscript.length} characters`
      );
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

    console.log(`[AI Summary] Sending request to Gemini...`);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();

    console.log(`[AI Summary] Received response, parsing...`);

    // Parse the JSON response
    const parsed = parseGeminiResponse(responseText);

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
      summary: parsed.summary.trim(),
      tags: normalizedTags.slice(0, 7), // Limit to 7 tags
      suggestedFolder: parsed.folder.trim().toLowerCase(),
      rawResponse: response,
    };
  } catch (error: any) {
    // Handle Gemini-specific errors
    if (error.message?.includes("API key")) {
      throw new SummarizationError("Invalid Gemini API key");
    }

    if (error.message?.includes("quota")) {
      throw new SummarizationError(
        "Gemini API quota exceeded. Please try again later."
      );
    }

    if (error.message?.includes("safety")) {
      throw new SummarizationError(
        "Content was blocked by Gemini safety filters"
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
