import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

const GameMetadataSchema = z.object({
  title: z
    .string()
    .describe("A catchy, concise game title (2-5 words). Creative and memorable."),
  description: z
    .string()
    .describe("A brief description of the game (1-2 sentences). Highlight the main gameplay."),
  gameType: z
    .string()
    .describe("The game type/genre that best matches. Must be one of the provided options."),
  optimizedPrompt: z
    .string()
    .describe("An enhanced version of the user's prompt with clearer instructions for the AI game builder. Add specific details about mechanics, controls, visuals, and win/lose conditions if not specified."),
});

export async function POST(req: NextRequest) {
  try {
    const { prompt, gameTypes, gameCreationMode } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
      return NextResponse.json(
        { error: "Please describe your game idea in more detail" },
        { status: 400 }
      );
    }

    if (!gameTypes || !Array.isArray(gameTypes) || gameTypes.length === 0) {
      return NextResponse.json(
        { error: "Game types are required" },
        { status: 400 }
      );
    }

    const gameTypesList = gameTypes.map((t: { name: string }) => t.name).join(", ");

    const systemPrompt = `You are helping create a 2D game using ${gameCreationMode === "javascript" ? "p5.js JavaScript" : "Blockly visual programming"}.

Given the user's game idea, generate:
1. A creative, catchy title (2-5 words)
2. A brief description (1-2 sentences)
3. Select the most appropriate game type from: ${gameTypesList}
4. An optimized prompt that adds clarity and specific details for the AI game builder

For the optimized prompt:
- Keep the user's core idea intact
- Add specific details about player controls (arrow keys, mouse, etc.)
- Clarify game mechanics if vague
- Suggest visual style if not mentioned
- Add win/lose conditions if missing
- Make it actionable for an AI code generator`;

    const { output } = await generateText({
      model: google("gemini-3-flash-preview"),
      output: Output.object({
        schema: GameMetadataSchema,
      }),
      system: systemPrompt,
      prompt: `User's game idea: "${prompt}"

Available game types: ${gameTypesList}

Generate the game metadata.`,
    });

    if (!output) {
      return NextResponse.json(
        { error: "Failed to generate game metadata" },
        { status: 500 }
      );
    }

    // Find the matching game type ID
    const matchedType = gameTypes.find(
      (t: { name: string; id: string }) =>
        t.name.toLowerCase() === output.gameType.toLowerCase()
    );

    return NextResponse.json({
      title: output.title,
      description: output.description,
      typeId: matchedType?.id || gameTypes[0].id,
      typeName: matchedType?.name || gameTypes[0].name,
      optimizedPrompt: output.optimizedPrompt,
    });
  } catch (error) {
    console.error("Generate metadata error:", error);
    return NextResponse.json(
      { error: "Failed to generate game metadata" },
      { status: 500 }
    );
  }
}
