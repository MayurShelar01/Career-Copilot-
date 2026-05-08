"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { storage } from "@/lib/storage/localStorage";

export function Header() {
  const pathname = usePathname();
  const [appCount, setAppCount] = useState(0);

  useEffect(() => {
    // Read count on mount
    const updateCount = () => {
      const apps = storage.getApplications();
      setAppCount(apps.length);
    };
    
    updateCount();

    // Listen for storage changes if updated in another tab (optional but good)
    window.addEventListener("storage", updateCount);
    
    // Poll for changes since localStorage updates in the same tab don't trigger "storage" event
    // Or we just update on interval or route change
    const interval = setInterval(updateCount, 2000);

    return () => {
      window.removeEventListener("storage", updateCount);
      clearInterval(interval);
    };
  }, []);

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
        </nav>
      </div>
    </header>
  );
}
