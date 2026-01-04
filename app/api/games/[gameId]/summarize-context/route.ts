import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

const SUMMARIZE_PROMPT = `You are a game development assistant. Analyze the following game code and provide a concise summary of:
1. Game type/genre (e.g., shooter, platformer, puzzle)
2. Core mechanics (player movement, shooting, collision, etc.)
3. Key game objects (player, enemies, projectiles, etc.)
4. Current features implemented
5. Game state management (score, lives, game over, etc.)

Keep the summary brief (2-4 sentences) but include all important details that would help understand what the game does.
Focus on WHAT the game does, not HOW the code is written.

If the code is empty or minimal, just say "Empty or minimal game code."`;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const { code, workspace, gameCreationMode } = await req.json();

    if (!gameId) {
      return NextResponse.json({ error: "Game ID required" }, { status: 400 });
    }

    // Determine what content to summarize
    let contentToSummarize: string;

    if (gameCreationMode === "javascript") {
      if (!code || code.trim().length < 50) {
        return NextResponse.json({
          summary: "Empty or minimal game code."
        });
      }
      contentToSummarize = code;
    } else {
      // Blockly mode - summarize the workspace JSON
      if (!workspace || typeof workspace !== "string" || workspace.length < 50) {
        return NextResponse.json({
          summary: "Empty or minimal game workspace."
        });
      }
      contentToSummarize = `Blockly workspace JSON:\n${workspace}`;
    }

    const { text: summary } = await generateText({
      model: google("gemini-flash-lite-latest"),
      prompt: `${SUMMARIZE_PROMPT}\n\n=== GAME CODE ===\n${contentToSummarize}`,
      maxOutputTokens: 200,
    });

    return NextResponse.json({ summary: summary.trim() });
  } catch (error) {
    console.error("Summarize context error:", error);
    return NextResponse.json(
      { error: "Failed to summarize game context" },
      { status: 500 }
    );
  }
}
