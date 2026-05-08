"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md p-8 bg-[#0A0A0A] border border-[#262626] rounded-xl shadow-2xl z-10 flex flex-col items-center space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign in to PM Career Copilot</h1>
          <p className="text-sm text-muted-foreground">Access your workspace and track applications.</p>
        </div>

        <Button 
          onClick={handleLogin} 
          disabled={loading}
          className="w-full h-12 text-base font-medium bg-[#A78BFA] hover:bg-[#8B5CF6] text-white transition-colors"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Connecting to Google...</>
          ) : (
            "Continue with Google"
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center pt-4 border-t border-[#262626] w-full">
          Your data is private. We never share it.
        </p>
      </div>
    </main>
  );
}
