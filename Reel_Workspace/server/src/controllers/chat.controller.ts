import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { Reel } from "../models/Reel.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";
import mongoose from "mongoose";
import Groq from "groq-sdk";

// Lazy initialize Groq client to ensure env vars are loaded
let groq: Groq | null = null;

function getGroqClient(): Groq {
  if (!groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error(
        "GROQ_API_KEY environment variable is not set. Please add it to your .env file.",
      );
    }
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groq;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Ephemeral chat endpoint for AI tutor
 * Streams responses using Server-Sent Events
 * Does NOT save chat history to database
 *
 * @route POST /api/chat/ephemeral
 * @access Private
 */
export const ephemeralChat = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { reelId, messages } = req.body;
  const userId = req.user!._id;

  console.log(`[Chat Controller] Ephemeral chat request for reel: ${reelId}`);

  try {
    // Validate reelId format
    if (!mongoose.Types.ObjectId.isValid(reelId)) {
      throw new ValidationError("Invalid reel ID format");
    }

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new ValidationError("Messages array is required");
    }

    // Fetch reel with full context (optimized with select and lean)
    const reel = await Reel.findOne({
      _id: reelId,
      userId,
      isDeleted: false,
    })
      .select(
        "title summary transcript keyPoints examples detailedExplanation ocrText tags",
      )
      .lean();

    if (!reel) {
      throw new NotFoundError("Reel not found");
    }

    console.log(`[Chat Controller] Building context for reel: ${reel.title}`);

    // Build system prompt with reel context
    const systemPrompt = buildSystemPrompt(reel);

    // Prepare messages for LLM
    const llmMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m: ChatMessage) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    console.log(`[Chat Controller] Streaming response...`);

    // Set headers for Server-Sent Events
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Get Groq client and stream response
    const groqClient = getGroqClient();
    const stream = await groqClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: llmMessages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    });

    // Stream chunks to client
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(content);
      }
    }

    res.end();
    console.log(`[Chat Controller] ✓ Stream completed`);
  } catch (error: any) {
    console.error(`[Chat Controller] ❌ Error:`, error);

    // If headers not sent, send error response
    if (!res.headersSent) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to process chat request",
      });
    } else {
      // If streaming already started, just end the stream
      res.end();
    }
  }
};

/**
 * Build system prompt with reel context
 * Intelligently truncates transcript if too long
 */
function buildSystemPrompt(reel: any): string {
  const MAX_TRANSCRIPT_LENGTH = 15000;

  // Truncate transcript if needed
  let transcript = reel.transcript || "";
  if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
    const half = Math.floor(MAX_TRANSCRIPT_LENGTH / 2);
    transcript = `${transcript.slice(
      0,
      half,
    )}\n\n[... content truncated ...]\n\n${transcript.slice(-half)}`;
  }

  // Build comprehensive context
  const context = `You are an expert AI tutor helping a student understand educational content from an Instagram Reel.

**REEL INFORMATION:**
Title: ${reel.title}

Summary: ${reel.summary}

${transcript ? `Transcript:\n${transcript}\n` : ""}

${
  reel.keyPoints && reel.keyPoints.length > 0
    ? `Key Points:\n${reel.keyPoints
        .map((p: string, i: number) => `${i + 1}. ${p}`)
        .join("\n")}\n`
    : ""
}

${
  reel.examples && reel.examples.length > 0
    ? `Examples:\n${reel.examples
        .map((e: string, i: number) => `${i + 1}. ${e}`)
        .join("\n")}\n`
    : ""
}

${
  reel.detailedExplanation
    ? `Detailed Explanation:\n${reel.detailedExplanation}\n`
    : ""
}

${reel.ocrText ? `Visual Text (OCR):\n${reel.ocrText}\n` : ""}

${reel.tags && reel.tags.length > 0 ? `Tags: ${reel.tags.join(", ")}\n` : ""}

**YOUR ROLE:**
- Answer questions using ONLY the context provided above
- Be concise, clear, and educational
- If asked for examples, create them based on the content
- If the question is unrelated to the reel content, politely redirect the user
- Use markdown formatting for better readability (bold, lists, code blocks)
- Be encouraging and supportive in your teaching style

**IMPORTANT:**
- Do NOT make up information not present in the context
- If you don't know something, say so honestly
- Keep responses focused and practical`;

  return context;
}
