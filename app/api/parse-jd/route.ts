import { NextResponse } from "next/server";
import { aiClient } from "@/lib/ai/provider";
import { JD_PARSER_SYSTEM_PROMPT, buildJDParserPrompt } from "@/lib/ai/prompts";
import { ParsedJD } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jdText } = body;

    if (!jdText || typeof jdText !== "string" || jdText.length < 100) {
      return NextResponse.json(
        { success: false, error: "JD is too short (min 100 chars)" },
        { status: 400 }
      );
    }

    const prompt = buildJDParserPrompt(jdText);

    // Using aiClient to generate JSON
    const parsedData = await aiClient.generateJSON<Omit<ParsedJD, "id" | "createdAt" | "rawText">>({
      prompt,
      systemPrompt: JD_PARSER_SYSTEM_PROMPT,
    });

    const newParsedJD: ParsedJD = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      rawText: jdText,
      ...parsedData,
    };

    return NextResponse.json({ success: true, data: newParsedJD });
  } catch (error: unknown) {
    console.error("Parse JD Route Error:", error);
    return NextResponse.json(
      { success: false, error: "AI couldn't parse this JD — try a different one" },
      { status: 500 }
    );
  }
}
