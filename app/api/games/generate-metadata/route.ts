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
    .describe("An enhanced version of the user's prompt with clearer instructions for the AI game builder. Must match the specified game dimension (2D or 3D). Add specific details about mechanics, controls, visuals, and win/lose conditions if not specified."),
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

    // Determine game dimension and technology based on creation mode
    const is3D = gameCreationMode === "javascript3d";
    const techDescription = gameCreationMode === "javascript" 
      ? "p5.js JavaScript (2D)" 
      : gameCreationMode === "javascript3d"
        ? "Three.js JavaScript (3D)"
        : "Blockly visual programming (2D)";

    const systemPrompt = `You are helping create a ${is3D ? "3D" : "2D"} game using ${techDescription}.

${is3D ? "IMPORTANT: This is a 3D game using Three.js. The optimized prompt MUST describe a 3D game with 3D graphics, 3D models, 3D camera, and 3D world. Do NOT describe a 2D game." : ""}

Given the user's game idea, generate:
1. A creative, catchy title (2-5 words)
2. A brief description (1-2 sentences) - ${is3D ? "mention it's a 3D game" : ""}
3. Select the most appropriate game type from: ${gameTypesList}
4. An optimized prompt for the AI to build this ${is3D ? "3D" : "2D"} game

For the optimized prompt:
- Keep the user's core idea intact
- ${is3D ? "MUST describe a 3D game: use terms like '3D world', '3D models', '3D camera', 'Three.js', 'WebGL', '3D space', 'depth', 'z-axis', etc." : "Focus on 2D visuals and mechanics"}
- ${is3D ? "Describe 3D camera setup (perspective camera, orbit controls, first-person, third-person, etc.)" : ""}
- ${is3D ? "Mention 3D lighting (ambient light, directional light, point lights, shadows)" : ""}
- ${is3D ? "Describe 3D objects using geometry terms (BoxGeometry, SphereGeometry, etc.) or 3D models" : ""}
- Add specific details about player controls (${is3D ? "WASD for movement, mouse for camera/aiming, Space for jump" : "arrow keys, mouse, etc."})
- Clarify game mechanics if vague
- Suggest visual style if not mentioned (${is3D ? "e.g., low-poly 3D, realistic 3D, stylized 3D" : "e.g., pixel art, minimalist, colorful"})
- Add win/lose conditions if missing
- Make it actionable for an AI code generator using ${is3D ? "Three.js (explicitly mention Three.js in the prompt)" : gameCreationMode === "javascript" ? "p5.js" : "Blockly"}`;

    const { output } = await generateText({
      model: google("gemini-3-flash-preview"),
      output: Output.object({
        schema: GameMetadataSchema,
      }),
      system: systemPrompt,
      prompt: `User's game idea: "${prompt}"

Game dimension: ${is3D ? "3D (Three.js)" : "2D"}
Available game types: ${gameTypesList}

Generate the game metadata. ${is3D ? "Remember: The optimized prompt MUST be for a 3D game using Three.js, not a 2D game." : ""}`,
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
