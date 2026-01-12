import Groq from "groq-sdk";
import { SummarizationError } from "../utils/errors.js";
import { SignificantInfoType, ExtractedEntity } from "./aiEntityExtraction.js";

/**
 * Structured caption analysis result
 */
export interface CaptionAnalysisResult {
  keyPoints: string[];
  hashtags: string[];
  mentions: string[];
  urls: string[];
  callsToAction: string[];
  topics: string[];
  sentiment: "positive" | "neutral" | "negative";
  hasImportantInfo: boolean;
  summary?: string;
}

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
 * Extract structured information from Instagram caption
 */
export async function analyzeCaptionWithAI(
  caption: string
): Promise<CaptionAnalysisResult> {
  if (!caption || caption.trim().length === 0) {
    return {
      keyPoints: [],
      hashtags: [],
      mentions: [],
      urls: [],
      callsToAction: [],
      topics: [],
      sentiment: "neutral",
      hasImportantInfo: false,
    };
  }

  console.log(`[Caption Analyzer] Analyzing caption (${caption.length} chars)`);

  try {
    const groq = initializeGroq();
    const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const prompt = `You are an expert at analyzing Instagram captions. Extract structured information from this caption.

Caption:
${caption}

Extract:
1. Key Points - Main messages, important facts, actionable advice (max 5)
2. Hashtags - All hashtags mentioned
3. Mentions - All @mentions
4. URLs - All links/domains mentioned
5. Calls to Action - Any requests/instructions to viewers (e.g., "Follow for more", "Link in bio")
6. Topics - Main subjects/themes discussed
7. Sentiment - Overall tone (positive/neutral/negative)
8. Summary - One sentence summary of the caption (optional, only if caption is long)

Rules:
- Extract ONLY information explicitly present in the caption
- Key points should be concise and actionable
- Do NOT hallucinate or infer information
- Return empty arrays if nothing found

Return ONLY valid JSON in this exact format:
{
  "keyPoints": ["Point 1", "Point 2"],
  "hashtags": ["#hashtag1", "#hashtag2"],
  "mentions": ["@username1", "@username2"],
  "urls": ["example.com", "link.bio"],
  "callsToAction": ["Follow for more tips"],
  "topics": ["productivity", "career"],
  "sentiment": "positive",
  "hasImportantInfo": true,
  "summary": "Brief summary if needed"
}`;

    const response = await groq.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1500,
    });

    const result = JSON.parse(
      response.choices[0].message.content || "{}"
    ) as CaptionAnalysisResult;

    // Ensure all required fields exist
    const analysis: CaptionAnalysisResult = {
      keyPoints: result.keyPoints || [],
      hashtags: result.hashtags || [],
      mentions: result.mentions || [],
      urls: result.urls || [],
      callsToAction: result.callsToAction || [],
      topics: result.topics || [],
      sentiment: result.sentiment || "neutral",
      hasImportantInfo: result.hasImportantInfo || false,
      summary: result.summary,
    };

    console.log(
      `[Caption Analyzer] Extracted ${analysis.keyPoints.length} key points, ${analysis.hashtags.length} hashtags, ${analysis.urls.length} URLs`
    );

    return analysis;
  } catch (error: any) {
    console.error(
      `[Caption Analyzer] Failed to analyze caption:`,
      error.message
    );

    // Fallback to regex-based extraction
    return extractCaptionWithRegex(caption);
  }
}

/**
 * Fallback: Extract basic information using regex patterns
 */
function extractCaptionWithRegex(caption: string): CaptionAnalysisResult {
  console.log(`[Caption Analyzer] Using regex fallback`);

  // Extract hashtags
  const hashtagRegex = /#[\w]+/g;
  const hashtags = caption.match(hashtagRegex) || [];

  // Extract mentions
  const mentionRegex = /@[\w.]+/g;
  const mentions = caption.match(mentionRegex) || [];

  // Extract URLs (simple pattern)
  const urlRegex =
    /(?:https?:\/\/)?(?:www\.)?[\w-]+\.[\w]{2,}(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?/g;
  const urls = caption.match(urlRegex) || [];

  // Detect common CTAs
  const ctaPatterns = [
    /follow\s+(?:me|us|for)/i,
    /link\s+in\s+bio/i,
    /check\s+out/i,
    /visit\s+(?:my|our)/i,
    /dm\s+(?:me|us)/i,
    /comment\s+below/i,
    /tag\s+(?:a|someone)/i,
    /share\s+(?:this|with)/i,
  ];

  const callsToAction: string[] = [];
  for (const pattern of ctaPatterns) {
    const match = caption.match(pattern);
    if (match) {
      callsToAction.push(match[0]);
    }
  }

  // Simple sentiment detection
  const positiveWords =
    /(?:great|amazing|awesome|love|best|perfect|excellent)/i;
  const negativeWords = /(?:bad|worst|hate|terrible|awful|poor)/i;

  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  if (positiveWords.test(caption)) {
    sentiment = "positive";
  } else if (negativeWords.test(caption)) {
    sentiment = "negative";
  }

  // Split into sentences for key points
  const sentences = caption
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10 && s.length < 200)
    .slice(0, 5);

  const hasImportantInfo =
    hashtags.length > 0 ||
    mentions.length > 0 ||
    urls.length > 0 ||
    callsToAction.length > 0;

  return {
    keyPoints: sentences,
    hashtags,
    mentions,
    urls,
    callsToAction,
    topics: hashtags.map((h) => h.replace("#", "").toLowerCase()),
    sentiment,
    hasImportantInfo,
  };
}

/**
 * Merge caption analysis into entity extraction format
 */
export function captionToEntities(
  analysis: CaptionAnalysisResult
): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  // Add URLs as website entities
  for (const url of analysis.urls) {
    entities.push({
      type: SignificantInfoType.WEBSITES_URLS,
      value: url,
      context: "from Instagram caption",
      sourceType: "metadata",
      confidence: 0.9,
    });
  }

  // Add mentions as people/orgs
  for (const mention of analysis.mentions) {
    entities.push({
      type: SignificantInfoType.PEOPLE_ORGS,
      value: mention,
      context: "mentioned in caption",
      sourceType: "metadata",
      confidence: 0.9,
    });
  }

  // Add key points as recommendations
  for (const point of analysis.keyPoints.slice(0, 3)) {
    // Limit to top 3
    entities.push({
      type: SignificantInfoType.RECOMMENDATIONS,
      value: point,
      context: "from caption",
      sourceType: "metadata",
      confidence: 0.85,
    });
  }

  return entities;
}
