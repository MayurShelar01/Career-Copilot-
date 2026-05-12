"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get("error");

  const handleLogin = async () => {
    setLoading(true);
    const supabase = createClient();
    // Use explicit NEXT_PUBLIC_SITE_URL if set, otherwise fall back to current origin.
    // This prevents Supabase from redirecting to an old/wrong deployment URL.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });
  };

  return (
    <div className="w-full max-w-md p-8 bg-[#0A0A0A] border border-[#262626] rounded-2xl shadow-2xl z-10 flex flex-col items-center space-y-6">
      {/* Logo */}
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 drop-shadow-md mb-2">
        <defs>
          <linearGradient id="c-grad-login" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF"/>
            <stop offset="50%" stopColor="#94A3B8"/>
            <stop offset="100%" stopColor="#334155"/>
          </linearGradient>
          <linearGradient id="p-grad-login" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6"/>
            <stop offset="100%" stopColor="#7C3AED"/>
          </linearGradient>
        </defs>
        <g strokeWidth="22" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 65 25 A 35 35 0 1 0 65 85" stroke="url(#c-grad-login)" />
          <path d="M 65 105 L 65 25 L 80 25 A 25 25 0 0 1 80 75 L 65 75" stroke="url(#p-grad-login)" />
        </g>
      </svg>
      
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome to PM Career Copilot</h1>
        <p className="text-sm text-muted-foreground">Your AI-powered job search workspace</p>
      </div>

      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500" />
        </span>
        Built for aspiring PMs
      </div>

      {errorMessage && (
        <div className="w-full flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      <Button 
        onClick={handleLogin} 
        disabled={loading}
        className="w-full h-12 text-base font-medium bg-white hover:bg-zinc-100 text-black transition-colors rounded-lg gap-3"
      >
        {loading ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> Connecting...</>
        ) : (
          <><GoogleIcon /> Continue with Google</>
        )}
      </Button>

      <div className="flex items-center gap-3 w-full">
        <div className="h-px bg-[#262626] flex-1" />
        <span className="text-xs text-zinc-600">secure authentication</span>
        <div className="h-px bg-[#262626] flex-1" />
      </div>

      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        Your data is private and encrypted. We never share your information.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-grid pointer-events-none opacity-30" />
      
      <Suspense fallback={
        <div className="w-full max-w-md p-8 bg-[#0A0A0A] border border-[#262626] rounded-2xl shadow-2xl z-10 flex flex-col items-center space-y-8">
          <div className="h-14 w-14 skeleton-shimmer rounded-full" />
          <div className="h-8 skeleton-shimmer rounded w-64" />
          <div className="h-12 skeleton-shimmer rounded-lg w-full" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </main>
  );
}
