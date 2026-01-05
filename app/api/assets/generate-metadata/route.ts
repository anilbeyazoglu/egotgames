import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

const AssetMetadataSchema = z.object({
  title: z
    .string()
    .describe(
      "A concise, descriptive title for this game asset (2-5 words). Should clearly identify what the asset depicts."
    ),
  description: z
    .string()
    .describe(
      "A detailed description of the asset (1-3 sentences). Include visual characteristics, style, potential use cases in games, and any notable features."
    ),
  suggestedType: z
    .enum(["sprite", "tileset", "background", "ui", "animation", "other"])
    .describe(
      "The most appropriate asset type based on the image content and intended use."
    ),
  tags: z
    .array(z.string())
    .describe(
      "3-6 relevant tags for searchability (e.g., 'character', 'medieval', 'weapon', 'pixel-art', 'fantasy')."
    ),
});

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, generationPrompt } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }

    // Clean the base64 if it includes data URL prefix
    const cleanBase64 = imageBase64.includes("base64,")
      ? imageBase64.split("base64,")[1]
      : imageBase64;

    const systemPrompt = `You are an expert at analyzing pixel art game assets. Your task is to generate metadata for game assets that will help game developers discover and use them effectively.

When analyzing the image:
1. Identify what the asset depicts (character, item, environment, UI element, etc.)
2. Note the art style (pixel art, resolution, color palette)
3. Consider how this asset would be used in a 2D game
4. Generate a clear, searchable title and detailed description

The metadata you generate will be used by AI game development assistants to help users find and select appropriate assets for their games.`;

    const userPrompt = generationPrompt
      ? `Analyze this pixel art game asset and generate metadata for it.

The asset was generated with this prompt: "${generationPrompt}"

Generate a title, description, suggested type, and relevant tags for this asset.`
      : `Analyze this pixel art game asset and generate metadata for it.

Generate a title, description, suggested type, and relevant tags for this asset.`;

    const { output } = await generateText({
      model: google("gemini-2.0-flash"),
      output: Output.object({
        schema: AssetMetadataSchema,
      }),
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt,
            },
            {
              type: "image",
              image: cleanBase64,
            },
          ],
        },
      ],
    });

    if (!output) {
      return NextResponse.json(
        { error: "Failed to generate asset metadata" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      title: output.title,
      description: output.description,
      suggestedType: output.suggestedType,
      tags: output.tags,
    });
  } catch (error) {
    console.error("Generate asset metadata error:", error);
    return NextResponse.json(
      { error: "Failed to generate asset metadata" },
      { status: 500 }
    );
  }
}
