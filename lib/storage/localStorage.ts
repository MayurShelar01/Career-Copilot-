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
  SESSION_CLEARED: "pmcc:session-cleared",
} as const;

import type { ParsedJD, ResumeAnalysis, ColdOutreach, PrepPlan, ApplicationCard, ApplicationStatus } from "@/types";

export const storage = {
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
    return getItem<ApplicationCard[]>(KEYS.APPLICATIONS) || [];
  },
  saveApplication(app: ApplicationCard): void {
    const existing = this.getApplications();
    const filtered = existing.filter(a => a.id !== app.id);
    setItem(KEYS.APPLICATIONS, [app, ...filtered]);
  },
  updateApplicationStatus(id: string, status: ApplicationStatus): void {
    const existing = this.getApplications();
    const updated = existing.map(app => 
      app.id === id ? { ...app, status, updatedAt: new Date().toISOString() } : app
    );
    setItem(KEYS.APPLICATIONS, updated);
  },
  updateApplicationNotes(id: string, notes: string): void {
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

