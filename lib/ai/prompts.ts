import type { ParsedJD } from "@/types";

// Placeholder for future feature prompts
export const SYSTEM_PROMPTS = {
  DEFAULT: "You are a helpful PM Career Copilot AI assistant.",
};

export const JD_PARSER_SYSTEM_PROMPT = `
You are an expert Product Management recruiter and career coach.
Your job is to parse job descriptions into structured, actionable data.
Be precise. Extract only what's in the JD — never invent details.
For "redFlags", flag things like: vague responsibilities, unrealistic experience asks,
buzzword overload, unpaid expectations, or scope mismatch with title.
Return ONLY valid JSON matching the requested schema.
`;

export const buildJDParserPrompt = (jdText: string) => `
Parse the following job description and return structured JSON.

Job Description:
"""
${jdText}
"""

Required JSON shape:
{
  "role": "string — exact job title",
  "company": "string — company name (or 'Unknown' if not stated)",
  "location": "string — location or 'Remote' or 'Unknown'",
  "summary": "string — 1-2 sentence TL;DR of what this role does",
  "mustHaves": ["array of 3-7 must-have requirements, concise phrases"],
  "niceToHaves": ["array of 3-7 nice-to-have requirements, concise phrases"],
  "keywords": ["array of exactly 10 ATS-relevant keywords/skills from the JD"],
  "redFlags": ["array of 0-5 concerns, empty array if none"]
}
}
`;

export const RESUME_ANALYZER_SYSTEM_PROMPT = `
You are an expert Product Management recruiter and resume coach.
You analyze how well a candidate's resume matches a specific job description.
Be honest — do not inflate scores. A "Strong" match means the candidate genuinely
hits 80%+ of the must-haves with evidence. Most resumes are "Partial".
Return ONLY valid JSON matching the requested schema.
`;

export const buildResumeAnalyzerPrompt = (
  parsedJD: ParsedJD,
  resumeText: string
) => `
Analyze this resume against the job description below.

JOB DESCRIPTION:
Role: ${parsedJD.role}
Company: ${parsedJD.company}
Must-haves: ${parsedJD.mustHaves.join(", ")}
Nice-to-haves: ${parsedJD.niceToHaves.join(", ")}
Keywords: ${parsedJD.keywords.join(", ")}

RESUME:
"""
${resumeText}
"""

Return JSON with this exact shape:
{
  "gapAnalysis": {
    "matchLabel": "Strong" | "Partial" | "Weak",
    "matchReasoning": "string — one sentence explaining the label honestly",
    "missingKeywords": ["array of JD keywords/skills not evidenced in resume"],
    "topImprovements": ["exactly 3 specific actionable improvements"]
  },
  "bullets": [
    {
      "text": "STAR-format bullet that the candidate could add/replace in their resume, tailored to this JD. Start with a strong action verb. Include metrics where reasonable.",
      "basedOn": "string — which area of their existing resume this enhances (e.g., 'Marketing internship', 'Side project')"
    }
    // generate 3 to 5 bullets total
  ]
}

Rules:
- Bullets must be grounded in the candidate's actual experience from the resume — do NOT invent achievements
- If the resume is too thin to ground a bullet, say so in topImprovements instead of fabricating
- Each bullet under 30 words, ideally 20-25
- Use strong action verbs: Led, Shipped, Drove, Architected, Reduced, Increased, Launched
`;

// ============= COLD OUTREACH =============

export const OUTREACH_SYSTEM_PROMPT = `
You are an expert at writing high-conversion LinkedIn outreach for job seekers.
You write messages that get replies — specific, warm, no buzzwords, no fluff.
Never use phrases like "I hope this finds you well", "passionate about", "synergy", "leverage".
Return ONLY valid JSON matching the schema.
`;

import { OutreachTone } from "@/types";

export const buildOutreachPrompt = (
  parsedJD: ParsedJD,
  tone: OutreachTone,
  userBackground: string
) => `
Generate a LinkedIn outreach pair for a job seeker targeting this role.

JOB:
Role: ${parsedJD.role}
Company: ${parsedJD.company}
Top must-haves: ${parsedJD.mustHaves.slice(0, 3).join(", ")}

CANDIDATE BACKGROUND:
${userBackground}

TONE: ${tone}
- Warm = friendly, human, conversational
- Professional = polished, respectful, neutral
- Bold = confident, direct, slightly cheeky (still respectful)

Return JSON:
{
  "connectionNote": "string — LinkedIn connection request note. STRICT max 300 characters including spaces. Should hook them: a specific reason you're reaching out + tiny credibility marker. No 'I hope this finds you well'.",
  "followUpDM": "string — sent after they accept. 600-800 characters. Structure: (1) thank them for connecting (1 line), (2) specific reason you reached out — reference the role + something genuine about the company/team, (3) 1-2 sentence credibility from candidate background, (4) soft ask (e.g., 'Would you be open to a quick chat?' or 'Any tips for someone breaking into PM at <company>?'). End warmly."
}

Hard rules:
- connectionNote MUST be ≤ 300 chars. Count carefully.
- followUpDM MUST be 600-800 chars.
- Reference the company name naturally.
- No emojis in either message.
- No fake personalization ("I love your work" without specifics).
`;

// ============= 7-DAY PREP PLAN =============

export const PREP_PLAN_SYSTEM_PROMPT = `
You are a Product Management interview coach.
You design focused 7-day prep plans that mix company research, behavioral prep,
PM frameworks, and case practice — tailored to a specific role and company.
Tasks must be specific and actionable, not generic ("research the company" is bad,
"read <company>'s last 3 product launches and write a 1-paragraph teardown of each" is good).
Return ONLY valid JSON matching the schema.
`;

export const buildPrepPlanPrompt = (parsedJD: ParsedJD) => `
Design a 7-day PM interview prep plan for this role.

ROLE: ${parsedJD.role}
COMPANY: ${parsedJD.company}
MUST-HAVES: ${parsedJD.mustHaves.join(", ")}
KEYWORDS: ${parsedJD.keywords.join(", ")}

Return JSON:
{
  "days": [
    {
      "day": 1,
      "title": "string — short theme for the day (3-5 words, e.g., 'Company Deep Dive')",
      "tasks": [
        "string — 3 to 5 specific tasks per day. Each task should be doable in 30-90 mins, concrete, and reference the company/role where relevant."
      ]
    }
    // ... exactly 7 days
  ]
}

Day structure guidance:
- Day 1: Company & product deep dive
- Day 2: Role-specific skill review (based on must-haves)
- Day 3: PM frameworks refresh (CIRCLES, AARM, RICE, North Star, etc.)
- Day 4: Behavioral question prep (STAR method, top 10 questions)
- Day 5: Product case practice (practice 1 design + 1 strategy case)
- Day 6: Mock interview / out-loud practice
- Day 7: Final review + logistics (resume polish, outfit, sleep, questions for them)

Tailor tasks to ${parsedJD.company} and ${parsedJD.role}. Be specific.
`;
