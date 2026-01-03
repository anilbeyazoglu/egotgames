import { NextRequest, NextResponse } from "next/server";

const PIXELLAB_API_URL = "https://api.pixellab.ai/v2";

interface GenerateRequest {
  tool: "create-image-pixflux" | "create-image-bitforge";
  description: string;
  negativeDescription?: string;
  width: number;
  height: number;
  direction?: string;
  noBackground?: boolean;
  initImage?: string; // base64
  textGuidanceScale?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json();

    if (!body.description) {
      return NextResponse.json(
        { error: "Description required" },
        { status: 400 }
      );
    }

    const apiToken = process.env.PIXELLAB_API_KEY;
    if (!apiToken) {
      return NextResponse.json(
        { error: "Pixellab API not configured" },
        { status: 500 }
      );
    }

    // Prepare request payload based on tool
    const endpoint =
      body.tool === "create-image-bitforge"
        ? "/create-image-bitforge"
        : "/create-image-pixflux";

    const payload: Record<string, unknown> = {
      description: body.description,
      image_size: {
        width: body.width || 128,
        height: body.height || 128,
      },
      no_background: body.noBackground ?? false,
    };

    if (body.negativeDescription) {
      payload.negative_description = body.negativeDescription;
    }

    if (body.direction) {
      payload.direction = body.direction;
    }

    if (body.textGuidanceScale) {
      payload.text_guidance_scale = body.textGuidanceScale;
    }

    if (body.initImage) {
      payload.init_image = {
        type: "base64",
        base64: body.initImage,
        format: "png",
      };
    }

    // Make request to Pixellab API
    const response = await fetch(`${PIXELLAB_API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.error || responseData.detail || "Generation failed" },
        { status: response.status }
      );
    }

    // Extract image from response
    const imageBase64 = responseData.image?.base64 || responseData.base64;

    return NextResponse.json({
      success: true,
      image: imageBase64,
      usage: responseData.usage,
    });
  } catch (error) {
    console.error("Pixellab generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
