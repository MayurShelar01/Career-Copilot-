import { NextResponse } from "next/server";
import { aiClient } from "@/lib/ai/provider";
import { OUTREACH_SYSTEM_PROMPT, buildOutreachPrompt } from "@/lib/ai/prompts";
import { ParsedJD, OutreachTone } from "@/types";
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
    const { parsedJD, tone, userBackground } = body as {
      parsedJD: ParsedJD;
      tone: OutreachTone;
      userBackground: string;
    };

    if (!parsedJD || !parsedJD.id) {
      return NextResponse.json({ success: false, error: "Missing parsedJD" }, { status: 400 });
    }

    if (!userBackground || userBackground.length < 20 || userBackground.length > 500) {
      return NextResponse.json({ success: false, error: "Background must be 20-500 characters" }, { status: 400 });
    }

    if (!["Warm", "Professional", "Bold"].includes(tone)) {
      return NextResponse.json({ success: false, error: "Invalid tone" }, { status: 400 });
    }

    const prompt = buildOutreachPrompt(parsedJD, tone, userBackground);
    let result = await aiClient.generateJSON<{ connectionNote: string; followUpDM: string }>({
      systemPrompt: OUTREACH_SYSTEM_PROMPT,
      prompt,
    });

    // Hard character limit protection
    if (result.connectionNote.length > 300) {
      const retryPrompt = prompt + "\n\nCRITICAL: The connectionNote MUST be under 300 characters. You failed this in the last attempt. Keep it extremely brief.";
      result = await aiClient.generateJSON<{ connectionNote: string; followUpDM: string }>({
        systemPrompt: OUTREACH_SYSTEM_PROMPT,
        prompt: retryPrompt,
      });

      if (result.connectionNote.length > 300) {
        console.warn(`Outreach connection note exceeded 300 chars even after retry. Truncating. JD ID: ${parsedJD.id}`);
        result.connectionNote = result.connectionNote.substring(0, 297) + "...";
      }
    }

    const outreach = {
      id: randomUUID(),
      parsedJDId: parsedJD.id,
      createdAt: new Date().toISOString(),
      tone,
      userBackground,
      connectionNote: result.connectionNote,
      followUpDM: result.followUpDM,
    };

    return NextResponse.json({ success: true, data: outreach });
  } catch (error: unknown) {
    console.error("Error generating outreach:", error);
    const message = error instanceof Error ? error.message : "Failed to generate outreach";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
