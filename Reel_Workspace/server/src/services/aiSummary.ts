import Groq from "groq-sdk";
import { SummarizationError } from "../utils/errors.js";

/**
 * Quiz question structure
 */
export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

/**
 * Common pitfall structure
 */
export interface CommonPitfall {
  pitfall: string;
  solution: string;
}

/**
 * Result from AI summarization
 */
export interface SummaryResult {
  title: string;
  summary: string;
  detailedExplanation: string;
  keyPoints: string[];
  examples: string[];
  relatedTopics: string[];
  actionableChecklist: string[];
  quizQuestions: QuizQuestion[];
  learningPath: string[];
  commonPitfalls: CommonPitfall[];
  interactivePromptSuggestions: string[];
  tags: string[];
  suggestedFolder: string;
  rawResponse?: unknown;
}

/**
 * Expected JSON structure from Groq
 */
interface GroqSummaryResponse {
  title: string;
  summary: string;
  detailedExplanation: string;
  keyPoints: string[];
  examples: string[];
  relatedTopics: string[];
  actionableChecklist: string[];
  quizQuestions: QuizQuestion[];
  learningPath: string[];
  commonPitfalls: CommonPitfall[];
  interactivePromptSuggestions: string[];
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
    const parsed = JSON.parse(responseText);

    // Helper to ensure array
    const ensureArray = (value: any, defaultValue: any[] = []) =>
      Array.isArray(value) ? value : defaultValue;

    // Validate quiz questions structure
    const quizQuestions = ensureArray(parsed.quizQuestions).map((q: any) => ({
      question: String(q?.question || ""),
      options: ensureArray(q?.options),
      answer: String(q?.answer || ""),
    }));

    // Validate common pitfalls
    const commonPitfalls = ensureArray(parsed.commonPitfalls).map((p: any) => ({
      pitfall: String(p?.pitfall || ""),
      solution: String(p?.solution || ""),
    }));

    return {
      title: String(parsed.title || "Untitled Reel"),
      summary: String(parsed.summary || ""),
      detailedExplanation: String(parsed.detailedExplanation || ""),
      keyPoints: ensureArray(parsed.keyPoints).map(String),
      examples: ensureArray(parsed.examples).map(String),
      relatedTopics: ensureArray(parsed.relatedTopics).map(String),
      actionableChecklist: ensureArray(parsed.actionableChecklist).map(String),
      quizQuestions,
      learningPath: ensureArray(parsed.learningPath).map(String),
      commonPitfalls,
      interactivePromptSuggestions: ensureArray(
        parsed.interactivePromptSuggestions
      ).map(String),
      tags: ensureArray(parsed.tags).map(String),
      folder: String(parsed.folder || "General"),
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

    // Create comprehensive analysis prompt with interactive features
    const prompt = `You are an expert content analyst and educator. Analyze the following transcript deeply and provide a comprehensive, interactive learning experience.

IMPORTANT: The transcript may be in Hindi, English, or mixed languages. Understand the content and provide ALL responses in English.

Provide this EXACT JSON format with ALL fields:

{
  "title": "A clear, descriptive, engaging title (5-10 words) that tells users exactly what this reel is about. Make it specific and informative, not generic. Examples: 'How to Build Muscle Fast at Home', '5 Python Tips for Beginners', 'Understanding Stock Market Basics'",
  
  "summary": "A concise 2-3 sentence overview of what the content is about",
  
  "detailedExplanation": "A comprehensive 4-6 paragraph explanation that covers:\n- What the topic is and why it matters\n- Key concepts explained in simple terms\n- How it works or applies in real life\n- Benefits or importance\n- Any tips or best practices mentioned\nUse clear, simple language with proper structure.",
  
  "keyPoints": [
    "First main point explained clearly",
    "Second main point with context",
    "Third main point with details",
    "Continue for all major points (3-7 points)"
  ],
  
  "examples": [
    "Real-world example 1 that illustrates the concept",
    "Practical example 2 showing application",
    "Use case example 3 (add 2-4 examples)"
  ],
  
  "relatedTopics": [
    "Related topic 1 that viewers might want to learn",
    "Related topic 2 for deeper understanding",
    "Related topic 3 for broader context",
    "Add 3-5 related topics"
  ],
  
  "actionableChecklist": [
    "Step 1: Clear, actionable first step to apply this topic",
    "Step 2: Specific second action with details",
    "Step 3: Third practical step",
    "Add 3-5 actionable steps users can take immediately"
  ],
  
  "quizQuestions": [
    {
      "question": "Clear question testing understanding of key concept",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Correct answer with brief explanation"
    },
    {
      "question": "Second question on different aspect",
      "options": ["Option A", "Option B", "Option C"],
      "answer": "Correct answer with explanation"
    },
    "Add 2-3 quiz questions"
  ],
  
  "quickReferenceCard": {
    "facts": [
      "Important fact 1",
      "Key statistic or data point",
      "Critical information to remember",
      "Add 3-5 essential facts"
    ],
  "learningPath": [
    "Beginner: First topic to learn",
    "Intermediate: Next level topic",
    "Advanced: Deep dive topic",
    "Related: Connected subject area",
    "Add 3-5 progressive learning topics"
  ],
  
  "commonPitfalls": [
    {
      "pitfall": "Common mistake 1 people make",
      "solution": "How to avoid this mistake with specific advice"
    },
    {
      "pitfall": "Typical error 2 beginners encounter",
      "solution": "Practical solution to prevent this"
    },
    "Add 2-3 common pitfalls with solutions"
  ],
  
  "interactivePromptSuggestions": [
    "Prompt 1: Specific question users can ask AI to learn more",
    "Prompt 2: Another useful prompt for deeper exploration",
    "Prompt 3: Creative prompt for practical application",
    "Add 2-3 AI prompts users can use"
  ],
  
  "tags": [
    "keyword1",
    "keyword2",
    "keyword3",
    "Add 5-10 relevant lowercase keywords"
  ],
  
  "folder": "Single category name (e.g., 'Education', 'Technology', 'Health', 'Business', 'Lifestyle')"
}

CRITICAL RULES:
- Title MUST be specific and descriptive (not "Untitled" or "Video about X")
- Title should clearly tell users what they'll learn or what the reel is about
- Write in simple, clear English that anyone can understand
- Make all content actionable and practical
- Ensure quiz questions test real understanding, not just recall
- Learning path should be progressive (beginner to advanced)
- Pitfalls should be realistic and solutions specific
- AI prompts should be specific and useful
- Return ONLY valid JSON, no markdown, no extra text
- All text fields must be in English (translate if needed)
- ALL fields are required - do not omit any
- Be comprehensive but concise
- Focus on educational value and practical application

Transcript to analyze:
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
      max_tokens: 8000, // Increased for comprehensive response
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
    console.log(`[AI Summary] Title: ${parsed.title}`);
    console.log(`[AI Summary] Summary: ${parsed.summary.substring(0, 100)}...`);
    console.log(`[AI Summary] Key Points: ${parsed.keyPoints.length}`);
    console.log(`[AI Summary] Examples: ${parsed.examples.length}`);
    console.log(
      `[AI Summary] Checklist Items: ${parsed.actionableChecklist.length}`
    );
    console.log(`[AI Summary] Quiz Questions: ${parsed.quizQuestions.length}`);
    console.log(`[AI Summary] Learning Path: ${parsed.learningPath.length}`);
    console.log(
      `[AI Summary] Common Pitfalls: ${parsed.commonPitfalls.length}`
    );
    console.log(`[AI Summary] Tags: ${normalizedTags.join(", ")}`);
    console.log(`[AI Summary] Folder: ${parsed.folder}`);

    return {
      title: parsed.title,
      summary: parsed.summary,
      detailedExplanation: parsed.detailedExplanation,
      keyPoints: parsed.keyPoints,
      examples: parsed.examples,
      relatedTopics: parsed.relatedTopics,
      actionableChecklist: parsed.actionableChecklist,
      quizQuestions: parsed.quizQuestions,
      learningPath: parsed.learningPath,
      commonPitfalls: parsed.commonPitfalls,
      interactivePromptSuggestions: parsed.interactivePromptSuggestions,
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
