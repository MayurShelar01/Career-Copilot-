import { NextResponse } from "next/server";
import { aiClient } from "@/lib/ai/provider";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, systemPrompt, json } = body;

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    let data;

    if (json) {
      data = await aiClient.generateJSON({ prompt, systemPrompt });
    } else {
      data = await aiClient.generate({ prompt, systemPrompt });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("AI Route Error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate AI response";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
