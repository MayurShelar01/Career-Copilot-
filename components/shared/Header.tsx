"use client";

import Link from "next/link";
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
    <header className="sticky top-0 z-50 w-full border-b border-[#262626] bg-[#0A0A0A]">
      <div className="flex h-14 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
        <Link href="/" className="font-bold text-violet-500 hover:text-violet-400 transition-colors">
          PM Career Copilot
        </Link>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/parse"
            className={`transition-colors hover:text-foreground/80 ${pathname === "/parse" ? "text-violet-500 border-b-2 border-violet-500 pb-1" : "text-foreground/60"}`}
          >
            Parse JD
          </Link>
          <Link
            href="/tracker"
            className={`transition-colors hover:text-foreground/80 flex items-center gap-2 ${pathname === "/tracker" ? "text-violet-500 border-b-2 border-violet-500 pb-1" : "text-foreground/60"}`}
          >
            Tracker
            {appCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-[10px] text-white">
                {appCount}
              </span>
            )}
          </Link>

          <div className="h-6 w-px bg-[#262626] mx-2"></div>

          {user ? (
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
              >
                {user.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Avatar" 
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
