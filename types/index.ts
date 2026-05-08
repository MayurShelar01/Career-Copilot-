// Global TypeScript types

export interface ParsedJD {
  id: string;                    // uuid, generated client-side
  createdAt: string;             // ISO timestamp
  rawText: string;               // original pasted JD
  role: string;
  company: string;
  location: string;
  mustHaves: string[];           // 3-7 items
  niceToHaves: string[];         // 3-7 items
  keywords: string[];            // exactly 10 items, ATS-relevant
  redFlags: string[];            // 0-5 items (vague responsibilities, unrealistic asks, etc.)
  summary: string;               // 1-2 sentence TL;DR of the role
}

export type MatchLabel = "Strong" | "Partial" | "Weak";

export interface ResumeGapAnalysis {
  matchLabel: MatchLabel;
  matchReasoning: string;         // 1-line explanation of the label
  missingKeywords: string[];      // keywords from JD not in resume
  topImprovements: string[];      // exactly 3 actionable improvements
}

export interface TailoredBullet {
  id: string;                     // uuid for editing/tracking
  text: string;                   // the STAR bullet
  basedOn: string;                // which resume area this enhances (e.g., "PM internship")
}

export interface ResumeAnalysis {
  id: string;                     // uuid
  parsedJDId: string;             // FK to ParsedJD
  createdAt: string;
  rawResume: string;
  gapAnalysis: ResumeGapAnalysis;
  bullets: TailoredBullet[];      // 3-5 STAR bullets
}

export type OutreachTone = "Warm" | "Professional" | "Bold";

export interface ColdOutreach {
  id: string;
  parsedJDId: string;
  createdAt: string;
  tone: OutreachTone;
  userBackground: string;          // short user-provided context (e.g., "ex-engineer transitioning to PM")
  connectionNote: string;          // ≤ 300 chars (LinkedIn connection request)
  followUpDM: string;              // 600-800 chars (sent after acceptance)
}

export interface PrepDay {
  day: number;                     // 1-7
  title: string;                   // e.g., "Company Deep Dive"
  tasks: string[];                 // 3-5 specific tasks
  completedTaskIndices: number[];  // tracks which tasks are checked off (by index)
}

export interface PrepPlan {
  id: string;
  parsedJDId: string;
  createdAt: string;
  days: PrepDay[];                 // exactly 7 days
}

export type ApplicationStatus =
  | "Saved"
  | "Applied"
  | "Interviewing"
  | "Offer"
  | "Rejected";

export interface ApplicationCard {
  id: string;                        // uuid
  parsedJDId: string;                // links to ParsedJD
  createdAt: string;
  updatedAt: string;
  status: ApplicationStatus;
  notes: string;                     // user-editable free text notes
  // Denormalized for quick display (don't re-fetch from parsedJDs):
  role: string;
  company: string;
  location: string;
}

