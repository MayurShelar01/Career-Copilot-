import { NextResponse } from "next/server";
import { aiClient } from "@/lib/ai/provider";
import { RESUME_ANALYZER_SYSTEM_PROMPT, buildResumeAnalyzerPrompt } from "@/lib/ai/prompts";
import type { ParsedJD, ResumeAnalysis, ResumeGapAnalysis, TailoredBullet } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { parsedJD, resumeText } = body;

    if (!parsedJD || typeof parsedJD !== "object" || !parsedJD.id) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing parsedJD" },
        { status: 400 }
      );
    }

    if (!resumeText || typeof resumeText !== "string" || resumeText.length < 200) {
      return NextResponse.json(
        { success: false, error: "Resume text must be at least 200 characters" },
        { status: 400 }
      );
    }

    const prompt = buildResumeAnalyzerPrompt(parsedJD as ParsedJD, resumeText);

    // Using aiClient to generate JSON
    const aiData = await aiClient.generateJSON<{ gapAnalysis: ResumeGapAnalysis, bullets: Omit<TailoredBullet, "id">[] }>({
      prompt,
      systemPrompt: RESUME_ANALYZER_SYSTEM_PROMPT,
    });

    const bulletsWithIds: TailoredBullet[] = aiData.bullets.map((b) => ({
      ...b,
      id: crypto.randomUUID(),
    }));

    const analysisData: ResumeAnalysis = {
      id: crypto.randomUUID(),
      parsedJDId: parsedJD.id,
      createdAt: new Date().toISOString(),
      rawResume: resumeText,
      gapAnalysis: aiData.gapAnalysis,
      bullets: bulletsWithIds,
    };

    return NextResponse.json({
      success: true,
      data: analysisData,
    });
  } catch (error: unknown) {
    console.error("Resume Analysis API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    
    // Provide a friendly error message if it's a JSON parse error or AI failure
    if (message.includes("JSON") || message.includes("Unexpected token")) {
      return NextResponse.json(
        { success: false, error: "AI couldn't analyze this resume — try again" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
