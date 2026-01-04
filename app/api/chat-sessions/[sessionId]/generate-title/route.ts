import { NextRequest, NextResponse } from "next/server";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

const anthropic = createAnthropic({
  apiKey: process.env.NEXT_ANTHROPIC_API_KEY,
});

/**
 * POST /api/chat-sessions/[sessionId]/generate-title
 * Generate a title from the first user message using AI
 * Client handles Firestore update directly
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.firstMessage) {
      return NextResponse.json(
        { error: "firstMessage is required" },
        { status: 400 }
      );
    }

    const modeDescription =
      body.gameCreationMode === "javascript"
        ? "JavaScript/p5.js"
        : "visual Blockly blocks";

    // Generate title using Claude Haiku (fast and cheap)
    const { text: title } = await generateText({
      model: anthropic("claude-3-haiku-20240307"),
      prompt: `Generate a short, descriptive title (max 40 characters) for an AI chat session about game development using ${modeDescription}. The user's first message was: "${body.firstMessage.slice(0, 200)}". Respond with only the title, no quotes or extra punctuation.`,
      maxOutputTokens: 50,
    });

    // Clean up the title
    const cleanTitle = title.trim().replace(/^["']|["']$/g, "").slice(0, 50);

    return NextResponse.json({ title: cleanTitle });
  } catch (error) {
    console.error("Error generating title:", error);
    return NextResponse.json(
      { error: "Failed to generate title" },
      { status: 500 }
    );
  }
}
