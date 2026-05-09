/**
 * Environment variable validation.
 * Import this in server-side code to ensure all required env vars are present.
 * Fails fast at startup rather than producing cryptic runtime errors.
 */

interface EnvConfig {
  GEMINI_API_KEY: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}

function validateEnv(): EnvConfig {
  const required = [
    "GEMINI_API_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ] as const;

  const missing: string[] = [];
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join("\n  ")}\n\nAdd them to your .env.local file.`
    );
  }

  return {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  };
}

export const env = validateEnv();
