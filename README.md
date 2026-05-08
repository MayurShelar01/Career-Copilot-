# PM Career Copilot

An AI-powered web app that turns a job description + resume into a complete application strategy.

## Tech Stack
- Next.js 14 with App Router
- TypeScript (strict mode)
- TailwindCSS
- shadcn/ui
- Google Gemini API (@google/generative-ai)
- Storage: Supabase Postgres
- Authentication: Google OAuth (via Supabase Auth)

## Setup Instructions
1. Run `npm install` to install dependencies.
2. Copy `.env.example` to `.env.local` and add your `GEMINI_API_KEY`.
3. Add your Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) to `.env.local`.
4. Run `npm run dev` to start the development server on localhost:3000.

## Architecture Note
All AI calls go through `lib/ai/provider.ts` — swap providers by changing the `AI_PROVIDER` env var.

## Roadmap
- Phase 1: Scaffold the project foundation (Completed)
- Phase 2: JD Parser & Resume Gap Analysis
- Phase 3: Application Strategy Generator
- Phase 4: LinkedIn Outreach & Prep Plan
- Phase 5: Application Tracker
