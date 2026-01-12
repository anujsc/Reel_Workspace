import Groq from "groq-sdk";
import { SummarizationError } from "../utils/errors.js";

/**
 * Entity types (topic-agnostic)
 */
export enum SignificantInfoType {
  TOOLS_PLATFORMS = "tools_platforms",
  WEBSITES_URLS = "websites_urls",
  BRANDS_PRODUCTS = "brands_products",
  PEOPLE_ORGS = "people_orgs",
  LISTS_SEQUENCES = "lists_sequences",
  STEPS_PROCESSES = "steps_processes",
  COMPARISONS = "comparisons",
  NUMBERS_METRICS = "numbers_metrics",
  PRICES_COSTS = "prices_costs",
  DATES_TIMELINES = "dates_timelines",
  CONTACT_INFO = "contact_info",
  RESOURCES_LINKS = "resources_links",
  RECOMMENDATIONS = "recommendations",
}

/**
 * Extracted entity structure
 */
export interface ExtractedEntity {
  type: SignificantInfoType;
  value: string;
  context?: string;
  sourceType: "audio" | "visual" | "metadata";
  timestamp?: number;
  confidence?: number;
}

/**
 * Entity extraction result
 */
export interface EntityExtractionResult {
  entities: ExtractedEntity[];
  rawResponse?: unknown;
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
 * Extract structured entities from text using AI
 */
export async function extractEntities(
  text: string,
  sourceType: "audio" | "visual" | "metadata",
  timestamp?: number
): Promise<EntityExtractionResult> {
  if (!text || text.trim().length === 0) {
    return { entities: [] };
  }

  console.log(
    `[Entity Extraction] Extracting entities from ${sourceType} text (${text.length} chars)`
  );

  try {
    const groq = initializeGroq();
    const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const prompt = `You are an expert information extraction system. Extract structured information from this ${sourceType} text.

IMPORTANT: Extract ONLY specific, concrete information. Do NOT extract generic terms.

Categories to extract:
1. Tools/Platforms - Software, apps, services, platforms (e.g., "Notion", "Figma", "Slack")
2. Websites/URLs - Domains, links, social handles (e.g., "notion.so", "figma.com", "@username")
3. Brands/Products - Companies, product names (e.g., "Apple", "iPhone", "MacBook")
4. People/Organizations - Names, agencies, institutions (e.g., "John Doe", "Google", "MIT")
5. Lists/Sequences - Numbered or bulleted items, sequences (e.g., "Step 1: X", "Item A")
6. Steps/Processes - How-to sequences, procedures (e.g., "First do X, then Y")
7. Numbers/Metrics - Stats, percentages, counts, measurements (e.g., "10GB", "50%", "3 years")
8. Prices/Costs - Money, pricing tiers (e.g., "$15/month", "₹999", "Free tier")
9. Dates/Times - Deadlines, schedules, durations (e.g., "Jan 15", "9am", "2 weeks")
10. Recommendations - Specific suggestions, advice (e.g., "Use X for Y")

Rules:
- Extract ONLY if the information is SPECIFIC (not generic)
- Include context for each entity
- Return empty array if no specific information found
- Do NOT hallucinate or infer information not present

Text to analyze:
${text}

Return ONLY valid JSON in this exact format:
{
  "entities": [
    {
      "type": "tools_platforms",
      "value": "Notion",
      "context": "mentioned as productivity tool"
    }
  ]
}`;

    const response = await groq.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    const entities: ExtractedEntity[] = (result.entities || []).map(
      (e: any) => ({
        type: e.type as SignificantInfoType,
        value: e.value,
        context: e.context,
        sourceType,
        timestamp,
        confidence: 0.85,
      })
    );

    console.log(
      `[Entity Extraction] Extracted ${entities.length} entities from ${sourceType}`
    );

    return {
      entities,
      rawResponse: response,
    };
  } catch (error: any) {
    console.error(
      `[Entity Extraction] Failed to extract entities:`,
      error.message
    );

    // Return empty result instead of throwing to allow pipeline to continue
    return { entities: [] };
  }
}

/**
 * Deduplicate entities with priority: visual > metadata > audio
 */
export function deduplicateEntities(
  entities: ExtractedEntity[],
  options: {
    priorityOrder?: Array<"audio" | "visual" | "metadata">;
    similarityThreshold?: number;
  } = {}
): ExtractedEntity[] {
  const {
    priorityOrder = ["visual", "metadata", "audio"],
    similarityThreshold = 0.85,
  } = options;

  // Group by normalized value
  const groups = new Map<string, ExtractedEntity[]>();

  for (const entity of entities) {
    const normalizedValue = entity.value.toLowerCase().trim();
    if (!groups.has(normalizedValue)) {
      groups.set(normalizedValue, []);
    }
    groups.get(normalizedValue)!.push(entity);
  }

  // For each group, keep the highest priority source
  const deduplicated: ExtractedEntity[] = [];

  for (const [_, groupEntities] of groups) {
    // Sort by priority
    groupEntities.sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.sourceType);
      const bPriority = priorityOrder.indexOf(b.sourceType);
      return aPriority - bPriority;
    });

    // Keep the highest priority entity
    deduplicated.push(groupEntities[0]);
  }

  console.log(
    `[Entity Extraction] Deduplicated ${entities.length} → ${deduplicated.length} entities`
  );

  return deduplicated;
}

/**
 * Categorize entities by type
 */
export function categorizeEntities(
  entities: ExtractedEntity[]
): Record<string, ExtractedEntity[]> {
  const categorized: Record<string, ExtractedEntity[]> = {};

  for (const entity of entities) {
    if (!categorized[entity.type]) {
      categorized[entity.type] = [];
    }
    categorized[entity.type].push(entity);
  }

  return categorized;
}
