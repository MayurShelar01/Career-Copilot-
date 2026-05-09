"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, FileCheck, PenTool, MessageSquare, Calendar, Layout, Loader2, ArrowRight, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);
  const features = [
    {
      icon: <Search className="w-5 h-5 text-violet-300" />,
      title: "JD Parser",
      description: "Paste any JD. Get role, keywords, red flags instantly.",
    },
    {
      icon: <FileCheck className="w-5 h-5 text-violet-300" />,
      title: "Gap Analyzer",
      description: "See exactly how your resume matches. Strong / Partial / Weak.",
    },
    {
      icon: <PenTool className="w-5 h-5 text-violet-300" />,
      title: "Tailored Bullets",
      description: "3-5 STAR bullets written from your experience, not templates.",
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-violet-300" />,
      title: "Cold Outreach",
      description: "LinkedIn connection note + follow-up DM. Tone: Warm, Pro, or Bold.",
    },
    {
      icon: <Calendar className="w-5 h-5 text-violet-300" />,
      title: "7-Day Prep Plan",
      description: "A day-by-day plan tailored to your role and company.",
    },
    {
      icon: <Layout className="w-5 h-5 text-violet-300" />,
      title: "Application Tracker",
      description: "Kanban board. Drag. Track. Export. No spreadsheets.",
    },
  ];

  return (
    <main className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="flex-1 flex flex-col z-10 w-full">
        
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden w-full">
          <div className="absolute inset-0 bg-grid pointer-events-none" />
          <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-violet-500/30 text-violet-300 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
              </span>
              Built for aspiring PMs
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-white mb-6">
              PM Career <span className="text-gradient-violet">Copilot</span>
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              From job link to full application strategy — in one workspace.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              {loading ? (
                <button disabled className="btn-glow px-7 py-3.5 rounded-full text-white font-medium inline-flex items-center gap-2 opacity-70 cursor-not-allowed">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
                </button>
              ) : user ? (
                <Link href="/parse" className="btn-glow px-7 py-3.5 rounded-full text-white font-medium inline-flex items-center gap-2">
                  Open Workspace
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link href="/login" className="btn-glow px-7 py-3.5 rounded-full text-white font-medium inline-flex items-center gap-2">
                  Sign in with Google
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <Link href="/tracker" className="glass px-7 py-3.5 rounded-full text-white font-medium border border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition">
                View Tracker
              </Link>
            </div>
            
            <div className="mt-8 flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
                <Lock className="w-3.5 h-3.5" />
                No login. No credit card. Your data stays in your browser.
              </div>
            </div>
          </div>
        </section>

        {/* 2. Feature Grid */}
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-5 pb-24 relative z-10 w-full">
          {features.map((feature, idx) => (
            <div key={idx} className="card-interactive p-7 group">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5
                              bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10
                              border border-violet-500/30
                              group-hover:border-violet-400/50 transition">
                {feature.icon}
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* 3. Bottom CTA */}
        <section className="w-full text-center space-y-8 pb-20 pt-10 border-t border-[#262626]">
          <h2 className="text-3xl font-bold text-foreground">Ready to apply smarter?</h2>
          {loading ? (
            <Button size="lg" disabled className="text-lg px-8 py-6 rounded-full bg-violet-500 text-white opacity-70">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
            </Button>
          ) : user ? (
            <Link href="/parse">
              <Button size="lg" className="text-lg px-8 py-6 rounded-full bg-violet-500 hover:bg-violet-600 text-white">
                Open Workspace →
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 py-6 rounded-full bg-violet-500 hover:bg-violet-600 text-white">
                Sign in with Google →
              </Button>
            </Link>
          )}
        </section>

      </div>
      
      <footer className="py-6 z-10 text-center border-t border-[#262626] bg-[#0A0A0A]">
        <p className="text-sm text-muted-foreground">
          Built by a PM, for PMs · Open source · Your data is private and secure
        </p>
      </footer>
    </main>
  );
}
