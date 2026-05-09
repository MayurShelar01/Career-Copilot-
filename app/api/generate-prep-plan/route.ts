import { NextResponse } from "next/server";
import { aiClient } from "@/lib/ai/provider";
import { PREP_PLAN_SYSTEM_PROMPT, buildPrepPlanPrompt } from "@/lib/ai/prompts";
import { ParsedJD } from "@/types";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { parsedJD } = body as { parsedJD: ParsedJD };

    if (!parsedJD || !parsedJD.id) {
      return NextResponse.json({ success: false, error: "Missing parsedJD" }, { status: 400 });
    }

    const prompt = buildPrepPlanPrompt(parsedJD);
    const result = await aiClient.generateJSON<{ days: { day: number; title: string; tasks: string[] }[] }>({
      systemPrompt: PREP_PLAN_SYSTEM_PROMPT,
      prompt,
    });

    if (!result.days || !Array.isArray(result.days) || result.days.length !== 7) {
      return NextResponse.json({ success: false, error: "AI failed to generate exactly 7 days." }, { status: 500 });
    }

    const prepPlan = {
      id: randomUUID(),
      parsedJDId: parsedJD.id,
      createdAt: new Date().toISOString(),
      days: result.days.map((day) => ({
        day: day.day,
        title: day.title,
        tasks: day.tasks,
        completedTaskIndices: [],
      })),
    };

    return NextResponse.json({ success: true, data: prepPlan });
  } catch (error: unknown) {
    console.error("Error generating prep plan:", error);
    const message = error instanceof Error ? error.message : "Failed to generate prep plan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
