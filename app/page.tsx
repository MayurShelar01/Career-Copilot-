"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, FileCheck, PenTool, MessageSquare, Calendar, Layout, Loader2 } from "lucide-react";
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
      icon: <Search className="w-6 h-6 text-violet-500" />,
      title: "JD Parser",
      description: "Paste any JD. Get role, keywords, red flags instantly.",
    },
    {
      icon: <FileCheck className="w-6 h-6 text-violet-500" />,
      title: "Gap Analyzer",
      description: "See exactly how your resume matches. Strong / Partial / Weak.",
    },
    {
      icon: <PenTool className="w-6 h-6 text-violet-500" />,
      title: "Tailored Bullets",
      description: "3-5 STAR bullets written from your experience, not templates.",
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-violet-500" />,
      title: "Cold Outreach",
      description: "LinkedIn connection note + follow-up DM. Tone: Warm, Pro, or Bold.",
    },
    {
      icon: <Calendar className="w-6 h-6 text-violet-500" />,
      title: "7-Day Prep Plan",
      description: "A day-by-day plan tailored to your role and company.",
    },
    {
      icon: <Layout className="w-6 h-6 text-violet-500" />,
      title: "Application Tracker",
      description: "Kanban board. Drag. Track. Export. No spreadsheets.",
    },
  ];

  return (
    <main className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="flex-1 flex flex-col items-center z-10 w-full max-w-6xl mx-auto px-4 md:px-8 py-20 space-y-24">
        
        {/* 1. Hero Section */}
        <section className="text-center space-y-8 max-w-3xl mx-auto pt-10">
          <div className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm text-violet-400">
            <span className="flex h-2 w-2 rounded-full bg-violet-500 mr-2 animate-pulse"></span>
            Built for aspiring PMs
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground relative">
            <span className="relative z-10">PM Career <span className="text-violet-500">Copilot</span></span>
          </h1>
          
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
            From job link to full application strategy — in one workspace.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {loading ? (
              <Button size="lg" disabled className="w-full sm:w-auto text-lg px-8 py-6 rounded-full bg-violet-500 text-white opacity-70">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
              </Button>
            ) : user ? (
              <Link href="/parse">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full bg-violet-500 hover:bg-violet-600 text-white shadow-[0_0_40px_-10px_rgba(167,139,250,0.5)] transition-all">
                  Open Workspace →
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full bg-violet-500 hover:bg-violet-600 text-white shadow-[0_0_40px_-10px_rgba(167,139,250,0.5)] transition-all">
                  Sign in with Google →
                </Button>
              </Link>
            )}
            <Link href="/tracker">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full border border-[#262626] hover:bg-[#111111] transition-all">
                View Tracker
              </Button>
            </Link>
          </div>
          
          <p className="text-xs text-muted-foreground/80 pt-2">
            No login. No credit card. Your data stays in your browser.
          </p>
        </section>

        {/* 2. Feature Grid */}
        <section className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="bg-[#111111] border border-[#262626] rounded-xl p-6 flex flex-col space-y-4 hover:border-violet-500/30 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

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
