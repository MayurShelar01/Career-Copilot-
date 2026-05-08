/**
 * Typed wrapper around localStorage
 */

export function getItem<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
}

export function removeItem(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

const KEYS = {
  PARSED_JDS: "pmcc:parsed-jds",
  RESUME_ANALYSES: "pmcc:resume-analyses",
  OUTREACHES: "pmcc:outreaches",
  PREP_PLANS: "pmcc:prep-plans",
  APPLICATIONS: "pmcc:applications",
  RESUME_VERSIONS: "pmcc:resume-versions",
  SESSION_CLEARED: "pmcc:session-cleared",
} as const;

import type { ParsedJD, ResumeAnalysis, ColdOutreach, PrepPlan, ApplicationCard, ApplicationStatus, ApplicationNotes, ResumeVersion } from "@/types";

/** Empty default for new ApplicationNotes — all 6 fields as empty strings */
const EMPTY_NOTES: ApplicationNotes = {
  recruiterName: "",
  interviewDate: "",
  hiringManager: "",
  keyThemes: "",
  questionsToAsk: "",
  postInterviewNotes: "",
};

/**
 * Migrates a card whose notes field may still be the old V1 string format.
 * - If notes is a string: converts it to ApplicationNotes, preserving the
 *   old freeform text in the postInterviewNotes field.
 * - If notes is already an object: returns the card unchanged.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateNotesIfNeeded(card: any): ApplicationCard {
  if (typeof card.notes === "string") {
    return {
      ...card,
      notes: {
        ...EMPTY_NOTES,
        postInterviewNotes: card.notes || "",
      } satisfies ApplicationNotes,
    };
  }
  return card as ApplicationCard;
}

export const storage = {
  // Resume Versions
  getResumeVersions(): ResumeVersion[] {
    const versions = getItem<ResumeVersion[]>(KEYS.RESUME_VERSIONS) || [];
    return versions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },
  getResumeVersionById(id: string): ResumeVersion | null {
    const existing = this.getResumeVersions();
    return existing.find((v) => v.id === id) || null;
  },
  saveResumeVersion(name: string, content: string): ResumeVersion {
    const existing = this.getResumeVersions();
    const now = new Date().toISOString();
    const newVersion: ResumeVersion = {
      id: crypto.randomUUID(),
      name,
      content,
      createdAt: now,
      updatedAt: now,
    };
    setItem(KEYS.RESUME_VERSIONS, [newVersion, ...existing]);
    return newVersion;
  },
  updateResumeVersion(id: string, updates: { name?: string; content?: string }): void {
    const existing = this.getResumeVersions();
    let updated = false;
    const newList = existing.map((v) => {
      if (v.id === id) {
        updated = true;
        return {
          ...v,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return v;
    });
    if (updated) {
      setItem(KEYS.RESUME_VERSIONS, newList);
    }
  },
  deleteResumeVersion(id: string): void {
    const existing = this.getResumeVersions();
    const filtered = existing.filter((v) => v.id !== id);
    setItem(KEYS.RESUME_VERSIONS, filtered);
  },

  getParsedJDs(): ParsedJD[] {
    return getItem<ParsedJD[]>(KEYS.PARSED_JDS) || [];
  },
  saveParsedJD(jd: ParsedJD): void {
    const existing = this.getParsedJDs();
    setItem(KEYS.PARSED_JDS, [jd, ...existing]);
  },
  getParsedJDById(id: string): ParsedJD | null {
    const existing = this.getParsedJDs();
    return existing.find((jd) => jd.id === id) || null;
  },
  deleteParsedJD(id: string): void {
    const existing = this.getParsedJDs();
    const filtered = existing.filter((jd) => jd.id !== id);
    setItem(KEYS.PARSED_JDS, filtered);
  },

  // Resume Analyses
  getResumeAnalyses(): ResumeAnalysis[] {
    return getItem<ResumeAnalysis[]>(KEYS.RESUME_ANALYSES) || [];
  },
  saveResumeAnalysis(analysis: ResumeAnalysis): void {
    const existing = this.getResumeAnalyses();
    // Overwrite existing analysis for this JD if it exists, otherwise prepend
    const filtered = existing.filter(a => a.parsedJDId !== analysis.parsedJDId);
    setItem(KEYS.RESUME_ANALYSES, [analysis, ...filtered]);
  },
  getResumeAnalysisByJDId(parsedJDId: string): ResumeAnalysis | null {
    const existing = this.getResumeAnalyses();
    return existing.find((a) => a.parsedJDId === parsedJDId) || null;
  },
  updateBulletText(analysisId: string, bulletId: string, newText: string): void {
    const existing = this.getResumeAnalyses();
    const updated = existing.map(analysis => {
      if (analysis.id === analysisId) {
        return {
          ...analysis,
          bullets: analysis.bullets.map(bullet => 
            bullet.id === bulletId ? { ...bullet, text: newText } : bullet
          )
        };
      }
      return analysis;
    });
    setItem(KEYS.RESUME_ANALYSES, updated);
  },

  // Cold Outreach
  getOutreaches(): ColdOutreach[] {
    return getItem<ColdOutreach[]>(KEYS.OUTREACHES) || [];
  },
  saveOutreach(outreach: ColdOutreach): void {
    const existing = this.getOutreaches();
    const filtered = existing.filter(o => o.parsedJDId !== outreach.parsedJDId);
    setItem(KEYS.OUTREACHES, [outreach, ...filtered]);
  },
  getOutreachByJDId(parsedJDId: string): ColdOutreach | null {
    const existing = this.getOutreaches();
    return existing.find((o) => o.parsedJDId === parsedJDId) || null;
  },

  // Prep Plans
  getPrepPlans(): PrepPlan[] {
    return getItem<PrepPlan[]>(KEYS.PREP_PLANS) || [];
  },
  savePrepPlan(plan: PrepPlan): void {
    const existing = this.getPrepPlans();
    const filtered = existing.filter(p => p.parsedJDId !== plan.parsedJDId);
    setItem(KEYS.PREP_PLANS, [plan, ...filtered]);
  },
  getPrepPlanByJDId(parsedJDId: string): PrepPlan | null {
    const existing = this.getPrepPlans();
    return existing.find((p) => p.parsedJDId === parsedJDId) || null;
  },
  toggleTaskCompletion(planId: string, dayNumber: number, taskIndex: number): void {
    const existing = this.getPrepPlans();
    const updated = existing.map(plan => {
      if (plan.id === planId) {
        return {
          ...plan,
          days: plan.days.map(day => {
            if (day.day === dayNumber) {
              const isCompleted = day.completedTaskIndices.includes(taskIndex);
              return {
                ...day,
                completedTaskIndices: isCompleted 
                  ? day.completedTaskIndices.filter(i => i !== taskIndex)
                  : [...day.completedTaskIndices, taskIndex]
              };
            }
            return day;
          })
        };
      }
      return plan;
    });
    setItem(KEYS.PREP_PLANS, updated);
  },

  // Applications
  getApplications(): ApplicationCard[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = getItem<any[]>(KEYS.APPLICATIONS) || [];
    return raw.map(migrateNotesIfNeeded);
  },
  saveApplication(app: ApplicationCard): void {
    // Ensure the new card always has a full ApplicationNotes object
    const normalized: ApplicationCard = {
      ...app,
      notes: typeof app.notes === "object" && app.notes !== null
        ? app.notes
        : EMPTY_NOTES,
    };
    const existing = this.getApplications();
    const filtered = existing.filter(a => a.id !== normalized.id);
    setItem(KEYS.APPLICATIONS, [normalized, ...filtered]);
  },
  updateApplicationStatus(id: string, status: ApplicationStatus): void {
    const existing = this.getApplications();
    const updated = existing.map(app => 
      app.id === id ? { ...app, status, updatedAt: new Date().toISOString() } : app
    );
    setItem(KEYS.APPLICATIONS, updated);
  },
  updateApplicationNotes(id: string, notes: ApplicationNotes): void {
    const existing = this.getApplications();
    const updated = existing.map(app => 
      app.id === id ? { ...app, notes, updatedAt: new Date().toISOString() } : app
    );
    setItem(KEYS.APPLICATIONS, updated);
  },
  deleteApplication(id: string): void {
    const existing = this.getApplications();
    setItem(KEYS.APPLICATIONS, existing.filter(a => a.id !== id));
  },
  getApplicationByJDId(parsedJDId: string): ApplicationCard | null {
    const existing = this.getApplications();
    return existing.find(a => a.parsedJDId === parsedJDId) || null;
  },

  // Session state
  setSessionCleared(): void {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem(KEYS.SESSION_CLEARED, "true");
    } catch {}
  },
  
  clearSessionCleared(): void {
    try {
      if (typeof window === "undefined") return;
      localStorage.removeItem(KEYS.SESSION_CLEARED);
    } catch {}
  },
  
  isSessionCleared(): boolean {
    try {
      if (typeof window === "undefined") return false;
      return localStorage.getItem(KEYS.SESSION_CLEARED) === "true";
    } catch {
      return false;
    }
  },
};

