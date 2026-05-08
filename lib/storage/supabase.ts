/**
 * Supabase implementation of the storage interface.
 * Replaces lib/storage/localStorage.ts — same public API, now async + cloud-persisted.
 */

import { createClient } from "@/lib/supabase/client";
import type {
  ParsedJD,
  ResumeAnalysis,
  ResumeGapAnalysis,
  TailoredBullet,
  ColdOutreach,
  PrepPlan,
  PrepDay,
  ApplicationCard,
  ApplicationStatus,
  ApplicationNotes,
  ResumeVersion,
} from "@/types";

// ---------------------------------------------------------------------------
// Helpers: DB row ↔ TypeScript type mappers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToJD(row: any): ParsedJD {
  return {
    id: row.id,
    createdAt: row.created_at,
    rawText: row.raw_jd ?? "",
    role: row.role ?? "",
    company: row.company ?? "",
    location: row.location ?? "",
    mustHaves: row.must_haves ?? [],
    niceToHaves: row.nice_to_haves ?? [],
    keywords: row.keywords ?? [],
    redFlags: row.red_flags ?? [],
    summary: row.summary ?? "",
  };
}

function jdToRow(jd: ParsedJD, userId: string) {
  return {
    id: jd.id,
    user_id: userId,
    role: jd.role,
    company: jd.company,
    location: jd.location,
    summary: jd.summary,
    must_haves: jd.mustHaves,
    nice_to_haves: jd.niceToHaves,
    keywords: jd.keywords,
    red_flags: jd.redFlags,
    raw_jd: jd.rawText,
    updated_at: new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAnalysis(row: any): ResumeAnalysis {
  const gapAnalysis: ResumeGapAnalysis = {
    matchLabel: row.match_label ?? "Partial",
    matchReasoning: row.match_reasoning ?? "",
    missingKeywords: row.missing_keywords ?? [],
    topImprovements: row.top_improvements ?? [],
  };
  return {
    id: row.id,
    parsedJDId: row.parsed_jd_id,
    createdAt: row.created_at,
    rawResume: row.resume_text ?? "",
    gapAnalysis,
    bullets: (row.tailored_bullets ?? []) as TailoredBullet[],
  };
}

function analysisToRow(a: ResumeAnalysis, userId: string) {
  return {
    id: a.id,
    user_id: userId,
    parsed_jd_id: a.parsedJDId,
    match_label: a.gapAnalysis.matchLabel,
    match_reasoning: a.gapAnalysis.matchReasoning,
    missing_keywords: a.gapAnalysis.missingKeywords,
    top_improvements: a.gapAnalysis.topImprovements,
    tailored_bullets: a.bullets,
    resume_text: a.rawResume,
    updated_at: new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToOutreach(row: any): ColdOutreach {
  return {
    id: row.id,
    parsedJDId: row.parsed_jd_id,
    createdAt: row.created_at,
    tone: row.tone ?? "Professional",
    userBackground: row.user_background ?? "",
    connectionNote: row.connection_note ?? "",
    followUpDM: row.follow_up_dm ?? "",
  };
}

function outreachToRow(o: ColdOutreach, userId: string) {
  return {
    id: o.id,
    user_id: userId,
    parsed_jd_id: o.parsedJDId,
    tone: o.tone,
    user_background: o.userBackground,
    connection_note: o.connectionNote,
    follow_up_dm: o.followUpDM,
    updated_at: new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPlan(row: any): PrepPlan {
  return {
    id: row.id,
    parsedJDId: row.parsed_jd_id,
    createdAt: row.created_at,
    days: (row.days ?? []) as PrepDay[],
  };
}

function planToRow(p: PrepPlan, userId: string) {
  return {
    id: p.id,
    user_id: userId,
    parsed_jd_id: p.parsedJDId,
    days: p.days,
    updated_at: new Date().toISOString(),
  };
}

const EMPTY_NOTES: ApplicationNotes = {
  recruiterName: "",
  interviewDate: "",
  hiringManager: "",
  keyThemes: "",
  questionsToAsk: "",
  postInterviewNotes: "",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToApp(row: any): ApplicationCard {
  const notes: ApplicationNotes =
    row.notes && typeof row.notes === "object"
      ? { ...EMPTY_NOTES, ...row.notes }
      : EMPTY_NOTES;
  return {
    id: row.id,
    parsedJDId: row.parsed_jd_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status ?? "Saved",
    notes,
    role: row.role ?? "",
    company: row.company ?? "",
    location: row.location ?? "",
  };
}

function appToRow(app: ApplicationCard, userId: string) {
  return {
    id: app.id,
    user_id: userId,
    parsed_jd_id: app.parsedJDId,
    role: app.role,
    company: app.company,
    location: app.location,
    status: app.status,
    notes: app.notes,
    updated_at: new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToVersion(row: any): ResumeVersion {
  return {
    id: row.id,
    name: row.name ?? "",
    content: row.resume_text ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Helper: get current user ID (throws if unauthenticated)
// ---------------------------------------------------------------------------
async function getUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ---------------------------------------------------------------------------
// Storage implementation
// ---------------------------------------------------------------------------

export const storage = {
  // ── Resume Versions ────────────────────────────────────────────────────────

  async getResumeVersions(): Promise<ResumeVersion[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("resume_versions")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) { console.error("getResumeVersions:", error); return []; }
    return (data ?? []).map(rowToVersion);
  },

  async getResumeVersionById(id: string): Promise<ResumeVersion | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("resume_versions")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return rowToVersion(data);
  },

  async saveResumeVersion(name: string, content: string): Promise<ResumeVersion> {
    const userId = await getUserId();
    const supabase = createClient();
    const now = new Date().toISOString();
    const row = {
      id: crypto.randomUUID(),
      user_id: userId,
      name,
      resume_text: content,
      created_at: now,
      updated_at: now,
    };
    const { data, error } = await supabase
      .from("resume_versions")
      .insert(row)
      .select()
      .single();
    if (error || !data) throw new Error("Failed to save resume version");
    return rowToVersion(data);
  },

  async updateResumeVersion(
    id: string,
    updates: { name?: string; content?: string }
  ): Promise<void> {
    const supabase = createClient();
    const patch: Record<string, string> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.content !== undefined) patch.resume_text = updates.content;
    const { error } = await supabase
      .from("resume_versions")
      .update(patch)
      .eq("id", id);
    if (error) console.error("updateResumeVersion:", error);
  },

  async deleteResumeVersion(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("resume_versions").delete().eq("id", id);
    if (error) console.error("deleteResumeVersion:", error);
  },

  // ── Parsed JDs ─────────────────────────────────────────────────────────────

  async getParsedJDs(): Promise<ParsedJD[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("parsed_jds")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error("getParsedJDs:", error); return []; }
    return (data ?? []).map(rowToJD);
  },

  async saveParsedJD(jd: ParsedJD): Promise<void> {
    const userId = await getUserId();
    const supabase = createClient();
    const { error } = await supabase
      .from("parsed_jds")
      .upsert(jdToRow(jd, userId));
    if (error) console.error("saveParsedJD:", error);
  },

  async getParsedJDById(id: string): Promise<ParsedJD | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("parsed_jds")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return rowToJD(data);
  },

  async deleteParsedJD(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("parsed_jds").delete().eq("id", id);
    if (error) console.error("deleteParsedJD:", error);
  },

  // ── Resume Analyses ────────────────────────────────────────────────────────

  async getResumeAnalyses(): Promise<ResumeAnalysis[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("resume_analyses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error("getResumeAnalyses:", error); return []; }
    return (data ?? []).map(rowToAnalysis);
  },

  async saveResumeAnalysis(analysis: ResumeAnalysis): Promise<void> {
    const userId = await getUserId();
    const supabase = createClient();
    // Upsert by id — overwrites existing analysis for the same JD
    const { error } = await supabase
      .from("resume_analyses")
      .upsert(analysisToRow(analysis, userId));
    if (error) console.error("saveResumeAnalysis:", error);
  },

  async getResumeAnalysisByJDId(parsedJDId: string): Promise<ResumeAnalysis | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("resume_analyses")
      .select("*")
      .eq("parsed_jd_id", parsedJDId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return rowToAnalysis(data);
  },

  async updateBulletText(
    analysisId: string,
    bulletId: string,
    newText: string
  ): Promise<void> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("resume_analyses")
      .select("tailored_bullets")
      .eq("id", analysisId)
      .single();
    if (error || !data) return;
    const bullets = (data.tailored_bullets ?? []) as TailoredBullet[];
    const updated = bullets.map((b) =>
      b.id === bulletId ? { ...b, text: newText } : b
    );
    await supabase
      .from("resume_analyses")
      .update({ tailored_bullets: updated, updated_at: new Date().toISOString() })
      .eq("id", analysisId);
  },

  // ── Cold Outreach ──────────────────────────────────────────────────────────

  async getOutreaches(): Promise<ColdOutreach[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("outreaches")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error("getOutreaches:", error); return []; }
    return (data ?? []).map(rowToOutreach);
  },

  async saveOutreach(outreach: ColdOutreach): Promise<void> {
    const userId = await getUserId();
    const supabase = createClient();
    const { error } = await supabase
      .from("outreaches")
      .upsert(outreachToRow(outreach, userId));
    if (error) console.error("saveOutreach:", error);
  },

  async getOutreachByJDId(parsedJDId: string): Promise<ColdOutreach | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("outreaches")
      .select("*")
      .eq("parsed_jd_id", parsedJDId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return rowToOutreach(data);
  },

  // ── Prep Plans ─────────────────────────────────────────────────────────────

  async getPrepPlans(): Promise<PrepPlan[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("prep_plans")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error("getPrepPlans:", error); return []; }
    return (data ?? []).map(rowToPlan);
  },

  async savePrepPlan(plan: PrepPlan): Promise<void> {
    const userId = await getUserId();
    const supabase = createClient();
    const { error } = await supabase
      .from("prep_plans")
      .upsert(planToRow(plan, userId));
    if (error) console.error("savePrepPlan:", error);
  },

  async getPrepPlanByJDId(parsedJDId: string): Promise<PrepPlan | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("prep_plans")
      .select("*")
      .eq("parsed_jd_id", parsedJDId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return rowToPlan(data);
  },

  async toggleTaskCompletion(
    planId: string,
    dayNumber: number,
    taskIndex: number
  ): Promise<void> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("prep_plans")
      .select("days")
      .eq("id", planId)
      .single();
    if (error || !data) return;
    const days = (data.days ?? []) as PrepDay[];
    const updatedDays = days.map((day) => {
      if (day.day === dayNumber) {
        const isCompleted = day.completedTaskIndices.includes(taskIndex);
        return {
          ...day,
          completedTaskIndices: isCompleted
            ? day.completedTaskIndices.filter((i) => i !== taskIndex)
            : [...day.completedTaskIndices, taskIndex],
        };
      }
      return day;
    });
    await supabase
      .from("prep_plans")
      .update({ days: updatedDays, updated_at: new Date().toISOString() })
      .eq("id", planId);
  },

  // ── Applications ───────────────────────────────────────────────────────────

  async getApplications(): Promise<ApplicationCard[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error("getApplications:", error); return []; }
    return (data ?? []).map(rowToApp);
  },

  async saveApplication(app: ApplicationCard): Promise<void> {
    const userId = await getUserId();
    const supabase = createClient();
    const { error } = await supabase
      .from("applications")
      .upsert(appToRow(app, userId));
    if (error) console.error("saveApplication:", error);
  },

  async updateApplicationStatus(
    id: string,
    status: ApplicationStatus
  ): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) console.error("updateApplicationStatus:", error);
  },

  async updateApplicationNotes(
    id: string,
    notes: ApplicationNotes
  ): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("applications")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) console.error("updateApplicationNotes:", error);
  },

  async deleteApplication(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", id);
    if (error) console.error("deleteApplication:", error);
  },

  async getApplicationByJDId(
    parsedJDId: string
  ): Promise<ApplicationCard | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("parsed_jd_id", parsedJDId)
      .maybeSingle();
    if (error || !data) return null;
    return rowToApp(data);
  },
};
