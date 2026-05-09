"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { storage } from "@/lib/storage/storage";
import { createClient } from "@/lib/supabase/client";
import { LogOut, User as UserIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export function Header() {
  const pathname = usePathname();
  const [appCount, setAppCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial session
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setAppCount(0);
      return;
    }

    const updateCount = async () => {
      try {
        const apps = await storage.getApplications();
        setAppCount(apps.length);
      } catch (err) {
        console.error(err);
      }
    };
    
    updateCount();
    
    // Poll for changes (since we can't easily rely on 'storage' event for DB changes without realtime)
    const interval = setInterval(updateCount, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [user]);

  const handleSignOut = async () => {
    // using the API route to clear server cookies as well
    await fetch("/auth/signout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-black/40 border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="hover:opacity-80 transition flex items-center" aria-label="PM Career Copilot">
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 drop-shadow-md">
            <defs>
              <linearGradient id="c-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF"/>
                <stop offset="50%" stopColor="#94A3B8"/>
                <stop offset="100%" stopColor="#334155"/>
              </linearGradient>
              <linearGradient id="p-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6"/>
                <stop offset="100%" stopColor="#7C3AED"/>
              </linearGradient>
            </defs>
            <g strokeWidth="22" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 65 25 A 35 35 0 1 0 65 85" stroke="url(#c-grad)" />
              <path d="M 65 105 L 65 25 L 80 25 A 25 25 0 0 1 80 75 L 65 75" stroke="url(#p-grad)" />
            </g>
          </svg>
        </Link>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/parse"
            className={`transition-colors relative text-sm font-medium ${pathname === "/parse" ? "text-white after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-violet-500 after:rounded-full" : "text-zinc-400 hover:text-white"}`}
          >
            Parse JD
          </Link>
          <Link
            href="/tracker"
            className={`transition-colors relative text-sm font-medium flex items-center gap-2 ${pathname === "/tracker" ? "text-white after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-violet-500 after:rounded-full" : "text-zinc-400 hover:text-white"}`}
          >
            Tracker
            {appCount > 0 && (
              <span className="bg-violet-500/15 text-violet-300 border border-violet-500/20 text-xs px-1.5 py-0.5 rounded-md ml-1.5">
                {appCount}
              </span>
            )}
          </Link>
          <Link
            href="/analytics"
            className={`transition-colors relative text-sm font-medium ${pathname === "/analytics" ? "text-white after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-violet-500 after:rounded-full" : "text-zinc-400 hover:text-white"}`}
          >
            Analytics
          </Link>

          <div className="h-6 w-px bg-[#262626] mx-2"></div>

          {user ? (
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
              >
                {user.user_metadata?.avatar_url ? (
                  <Image 
                    src={user.user_metadata.avatar_url} 
                    alt="Avatar" 
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full border border-[#262626]" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-500 flex items-center justify-center border border-violet-500/30">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </button>

              {dropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-md bg-[#111111] border border-[#262626] shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-[#262626]">
                      <p className="text-sm font-medium text-white truncate">
                        {user.user_metadata?.full_name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#262626] flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link 
              href="/login"
              className="text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 px-4 py-1.5 rounded-full transition-colors"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
