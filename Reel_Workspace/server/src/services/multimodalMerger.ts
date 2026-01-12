import { ExtractedEntity } from "./aiEntityExtraction.js";

/**
 * Multimodal content structure
 */
export interface MultimodalContent {
  mergedText: string;
  visualTexts: Array<{ timestamp: number; text: string }>;
  hasAudioTranscript: boolean;
  hasVisualText: boolean;
  hasMetadata: boolean;
}

/**
 * Merge multimodal content from audio, visual, and metadata sources
 */
export function mergeMultimodalContent(
  audioTranscript: string,
  visualTexts: Array<{ timestamp: number; text: string; confidence: number }>,
  metadata?: { caption?: string; description?: string }
): MultimodalContent {
  console.log(`[Multimodal Merger] Merging content from multiple sources`);
  console.log(
    `[Multimodal Merger] - Audio transcript: ${audioTranscript.length} chars`
  );
  console.log(
    `[Multimodal Merger] - Visual texts: ${visualTexts.length} frames`
  );
  console.log(
    `[Multimodal Merger] - Metadata: ${metadata?.caption ? "Yes" : "No"}`
  );

  // Filter out empty visual texts
  const validVisualTexts = visualTexts.filter((v) => v.text.trim().length > 0);

  // Format visual texts with timestamps
  const formattedVisualTexts = validVisualTexts
    .map((v) => `[Frame at ${v.timestamp}s]\n${v.text}`)
    .join("\n\n");

  // Create merged text for AI analysis
  const sections = [];

  // Audio section
  if (audioTranscript && audioTranscript.trim().length > 0) {
    sections.push(`AUDIO TRANSCRIPT:\n${audioTranscript}`);
  }

  // Visual section
  if (formattedVisualTexts.length > 0) {
    sections.push(
      `VISUAL TEXT (from ${validVisualTexts.length} frames):\n${formattedVisualTexts}`
    );
  }

  // Metadata section
  if (metadata?.caption && metadata.caption.trim().length > 0) {
    sections.push(`INSTAGRAM CAPTION:\n${metadata.caption}`);
  }

  if (metadata?.description && metadata.description.trim().length > 0) {
    sections.push(`DESCRIPTION:\n${metadata.description}`);
  }

  const mergedText = sections.join("\n\n---\n\n");

  console.log(`[Multimodal Merger] Merged text: ${mergedText.length} chars`);

  return {
    mergedText,
    visualTexts: validVisualTexts.map((v) => ({
      timestamp: v.timestamp,
      text: v.text,
    })),
    hasAudioTranscript: audioTranscript.trim().length > 0,
    hasVisualText: validVisualTexts.length > 0,
    hasMetadata: !!(metadata?.caption || metadata?.description),
  };
}

/**
 * Create multimodal-aware AI prompt
 */
export function createMultimodalPrompt(
  mergedContent: MultimodalContent,
  basePrompt: string
): string {
  const preamble = `You are analyzing content from MULTIPLE sources. Pay attention to what information comes from which source:

${
  mergedContent.hasAudioTranscript
    ? "✓ AUDIO: What was spoken/narrated"
    : "✗ No audio transcript"
}
${
  mergedContent.hasVisualText
    ? `✓ VISUAL: Text shown on screen (${mergedContent.visualTexts.length} frames)`
    : "✗ No visual text"
}
${
  mergedContent.hasMetadata
    ? "✓ METADATA: Instagram caption/description"
    : "✗ No metadata"
}

CRITICAL INSTRUCTIONS:
1. Prioritize VISUAL TEXT for specific names, lists, URLs, and numbers
2. Use AUDIO for context, explanations, and narrative
3. If audio says "here are some tools" but visual shows specific names, USE THE VISUAL NAMES
4. Flag when visual and audio provide complementary information
5. Extract ALL named entities (tools, websites, products, people) from visual text
6. Preserve lists and structured information exactly as shown visually

---

${mergedContent.mergedText}

---

${basePrompt}`;

  return preamble;
}
