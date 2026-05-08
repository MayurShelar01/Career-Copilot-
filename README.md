# PM Career Copilot

An AI-powered web app that turns a job description + resume into a complete application strategy.

## Tech Stack
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: TailwindCSS + shadcn/ui
- **Database**: Supabase (Auth + Postgres + RLS)
- **Authentication**: Google OAuth
- **AI**: Gemini AI (via LangChain-compatible abstraction)
- **Deployment**: Vercel

## Architecture Highlights
- **AI provider abstraction**: Switch from Gemini to Claude/OpenAI with one env var via `lib/ai/provider.ts`.
- **Storage abstraction**: Migrated from browser localStorage to Supabase Postgres with zero frontend rewrites by maintaining a unified storage interface.
- **Row-Level Security**: Database-enforced multi-tenancy from day 1, ensuring user data isolation.

## Setup
1. **Clone repo**: `git clone <repo-url>`
2. **Install dependencies**: `npm install`
3. **Supabase Setup**: Create a Supabase project and enable Google OAuth in the Authentication providers.
4. **Environment Variables**: Copy `.env.example` → `.env.local` and fill in your Gemini API key and Supabase credentials.
5. **Run local server**: `npm run dev`

## Roadmap
- Phase 1: Scaffold the project foundation (Completed)
- Phase 2: JD Parser & Resume Gap Analysis (Completed)
- Phase 3: Application Strategy Generator (Completed)
- Phase 4: LinkedIn Outreach & Prep Plan (Completed)
- Phase 5: Application Tracker (Completed)
- **Phase 6: Cloud Migration & Auth** (Completed)
