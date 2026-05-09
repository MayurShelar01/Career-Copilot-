"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, FileCheck, PenTool, MessageSquare, Calendar, Layout, ArrowRight, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Check session quickly
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);
  const features = [
    {
      icon: <Search className="w-5 h-5" />,
      title: "JD Parser",
      description: "Paste any JD. Get role, keywords, red flags instantly.",
      color: "violet",
      iconBg: "from-violet-500/20 to-violet-600/10",
      iconBorder: "border-violet-500/30",
      iconColor: "text-violet-300",
      step: "01",
    },
    {
      icon: <FileCheck className="w-5 h-5" />,
      title: "Gap Analyzer",
      description: "See exactly how your resume matches — Strong, Partial, or Weak.",
      color: "blue",
      iconBg: "from-blue-500/20 to-blue-600/10",
      iconBorder: "border-blue-500/30",
      iconColor: "text-blue-300",
      step: "02",
    },
    {
      icon: <PenTool className="w-5 h-5" />,
      title: "Tailored Bullets",
      description: "3-5 STAR bullets written from your experience, not templates.",
      color: "emerald",
      iconBg: "from-emerald-500/20 to-emerald-600/10",
      iconBorder: "border-emerald-500/30",
      iconColor: "text-emerald-300",
      step: "03",
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Cold Outreach",
      description: "LinkedIn connection note + follow-up DM. Warm, Pro, or Bold tone.",
      color: "amber",
      iconBg: "from-amber-500/20 to-amber-600/10",
      iconBorder: "border-amber-500/30",
      iconColor: "text-amber-300",
      step: "04",
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "7-Day Prep Plan",
      description: "A day-by-day plan tailored to your target role and company.",
      color: "rose",
      iconBg: "from-rose-500/20 to-rose-600/10",
      iconBorder: "border-rose-500/30",
      iconColor: "text-rose-300",
      step: "05",
    },
    {
      icon: <Layout className="w-5 h-5" />,
      title: "Application Tracker",
      description: "Kanban board. Drag. Track. Export. No more spreadsheets.",
      color: "cyan",
      iconBg: "from-cyan-500/20 to-cyan-600/10",
      iconBorder: "border-cyan-500/30",
      iconColor: "text-cyan-300",
      step: "06",
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
                <button className="glass px-7 py-3.5 rounded-full text-white/50 font-medium inline-flex items-center gap-2 animate-pulse cursor-wait">
                  <div className="h-4 w-24 bg-white/10 rounded" />
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
                Secure login. No credit card. Your data is private and persistent.
              </div>
            </div>
          </div>
        </section>

        {/* 2. Feature Grid */}
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-5 pb-24 relative z-10 w-full">
          {features.map((feature, idx) => (
            <div key={idx} className="card-interactive p-7 group relative overflow-hidden">
              <div className="absolute top-4 right-4 text-[10px] font-mono text-zinc-600 tracking-widest">{feature.step}</div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5
                              bg-gradient-to-br ${feature.iconBg}
                              border ${feature.iconBorder}
                              group-hover:scale-110 transition-transform duration-300 ${feature.iconColor}`}>
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
        <section className="w-full text-center flex flex-col items-center gap-12 pb-32 pt-24 border-t border-[#262626] bg-[#0A0A0A]">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Ready to apply smarter?</h2>
          {loading ? (
            <div className="h-16 w-64 mx-auto bg-white/5 rounded-full animate-pulse" />
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
