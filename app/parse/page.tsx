"use client";

import { useState, KeyboardEvent, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, ArrowLeft, Loader2, Copy, Check, Download, X, Home, ChevronRight, Lightbulb, Sparkles, ArrowRight, MessageSquare, CalendarDays, Briefcase, Plus, Tags, ShieldCheck, Bookmark } from "lucide-react";
import { motion } from "framer-motion";
import { storage } from "@/lib/storage/storage";
import { ParsedJD, ResumeAnalysis, OutreachTone, ColdOutreach, PrepPlan, ApplicationCard } from "@/types";
import { CardSkeleton, PlanDaySkeleton } from "@/components/shared/Skeleton";
import { ResumeSection } from "@/components/parse/ResumeSection";
import { toast } from "sonner";

function ParsePageContent() {
  const searchParams = useSearchParams();
  // JD Parsing states
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedJD | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Tracker states
  const [isSaved, setIsSaved] = useState(false);

  // Resume Analyzing states
  const [resumeText, setResumeText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  // Outreach
  const [userBackground, setUserBackground] = useState("");
  const [outreachTone, setOutreachTone] = useState<OutreachTone>("Professional");
  const [generatingOutreach, setGeneratingOutreach] = useState(false);
  const [outreach, setOutreach] = useState<ColdOutreach | null>(null);
  const [outreachError, setOutreachError] = useState<string | null>(null);
  const [isEditingOutreach, setIsEditingOutreach] = useState(false);
  const outreachRef = useRef<HTMLDivElement>(null);

  // Prep Plan
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [prepPlan, setPrepPlan] = useState<PrepPlan | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const planRef = useRef<HTMLDivElement>(null);

  const charCount = jdText.length;
  const canSubmit = charCount >= 100 && !loading;

  // JD URL Import state
  const [jdInputMode, setJdInputMode] = useState<"paste" | "url">("paste");
  const [jdUrl, setJdUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<{ source: string; charCount: number } | null>(null);



  function isValidURL(str: string): boolean {
    if (!str) return false;
    try { new URL(str); return true; } catch { return false; }
  }

  async function handleImportURL() {
    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);
    try {
      const response = await fetch("/api/import-jd-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jdUrl }),
      });
      const res = await response.json();
      if (!res.success) {
        setImportError(res.error || "Failed to import JD");
        return;
      }
      // Switch to paste mode and populate textarea
      setJdInputMode("paste");
      setJdText(res.data.text);
      setImportSuccess({ source: res.data.source, charCount: res.data.text.length });
      setTimeout(() => setImportSuccess(null), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network error";
      setImportError(message);
    } finally {
      setIsImporting(false);
    }
  }

  const resumeCharCount = resumeText.length;
  const canAnalyze = resumeCharCount >= 200 && !analyzing;

  const backgroundCharCount = userBackground.length;
  const canGenerateOutreach = backgroundCharCount >= 20 && !generatingOutreach;

  // Initial Hydration
  useEffect(() => {
    const fetchInitialData = async () => {
      const requestedJDId = searchParams.get("resume");
      
      if (requestedJDId) {
        const jd = await storage.getParsedJDById(requestedJDId);
        if (jd) {
          setResult(jd);
          const analysis = await storage.getResumeAnalysisByJDId(requestedJDId);
          if (analysis) setResumeAnalysis(analysis);
          
          const outreachData = await storage.getOutreachByJDId(requestedJDId);
          if (outreachData) setOutreach(outreachData);
          
          const plan = await storage.getPrepPlanByJDId(requestedJDId);
          if (plan) setPrepPlan(plan);
          return;
        }
      }

      const recentJDs = await storage.getParsedJDs();
      if (recentJDs.length > 0) {
        const latest = recentJDs[0];
        setResult(latest);
        
        const analysis = await storage.getResumeAnalysisByJDId(latest.id);
        if (analysis) setResumeAnalysis(analysis);
        
        const outreachData = await storage.getOutreachByJDId(latest.id);
        if (outreachData) setOutreach(outreachData);
        
        const plan = await storage.getPrepPlanByJDId(latest.id);
        if (plan) setPrepPlan(plan);
      }
    };
    fetchInitialData();
  }, [searchParams]);

  // Secondary Hydration (for when result changes within the page)
  useEffect(() => {
    if (result) {
      const fetchSecondaryData = async () => {
        const storedOutreach = await storage.getOutreachByJDId(result.id);
        if (storedOutreach) setOutreach(storedOutreach);

        const storedPlan = await storage.getPrepPlanByJDId(result.id);
        if (storedPlan) setPrepPlan(storedPlan);
        
        const storedApp = await storage.getApplicationByJDId(result.id);
        setIsSaved(!!storedApp);
      };
      fetchSecondaryData();
    }
  }, [result]);

  // JD Handlers
  const handleParse = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/parse-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdText }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to parse JD");
      setResult(data.data);
      await storage.saveParsedJD(data.data);
      toast.success("JD parsed successfully", { description: `${data.data.role} at ${data.data.company}` });

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleParse();
    }
  };

  const handleReset = () => {
    setResult(null);
    setJdText("");
    setError(null);
    setResumeText("");
    setResumeAnalysis(null);
    setAnalyzeError(null);
    setUserBackground("");
    setOutreachTone("Professional");
    setOutreach(null);
    setOutreachError(null);
    setIsEditingOutreach(false);
    setPrepPlan(null);
    setPlanError(null);
    setIsSaved(false);
  };

  // Resume Handlers
  const handleAnalyze = async () => {
    if (!canAnalyze || !result) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsedJD: result, resumeText }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "AI couldn't analyze — try again");
      setResumeAnalysis(data.data);
      await storage.saveResumeAnalysis(data.data);
      toast.success("Resume analyzed", { description: `Match: ${data.data.gapAnalysis.matchLabel}` });

      setTimeout(() => {
        analysisRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "An unexpected error occurred";
      setAnalyzeError(message);
    } finally {
      setAnalyzing(false);
    }
  };

  // Outreach Handlers
  const handleGenerateOutreach = async () => {
    if (!canGenerateOutreach || !result) return;
    setGeneratingOutreach(true);
    setOutreachError(null);
    try {
      const res = await fetch("/api/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsedJD: result, tone: outreachTone, userBackground }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to generate outreach");
      setOutreach(data.data);
      await storage.saveOutreach(data.data);
      setIsEditingOutreach(false);
      toast.success("Outreach messages generated");

      setTimeout(() => {
        outreachRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "An unexpected error occurred";
      setOutreachError(message);
    } finally {
      setGeneratingOutreach(false);
    }
  };

  const handleOutreachKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerateOutreach();
    }
  };

  // Prep Plan Handlers
  const handleGeneratePlan = async () => {
    if (!result) return;
    setGeneratingPlan(true);
    setPlanError(null);
    try {
      const res = await fetch("/api/generate-prep-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsedJD: result }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to generate prep plan");
      setPrepPlan(data.data);
      await storage.savePrepPlan(data.data);
      toast.success("7-day prep plan created");

      setTimeout(() => {
        planRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "An unexpected error occurred";
      setPlanError(message);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleRegeneratePlan = () => {
    if (window.confirm("Regenerating will reset all your checked tasks. Are you sure?")) {
      handleGeneratePlan();
    }
  };

  const toggleTask = async (dayNum: number, taskIdx: number) => {
    if (!prepPlan) return;
    await storage.toggleTaskCompletion(prepPlan.id, dayNum, taskIdx);
    // Local state update
    setPrepPlan(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map(d => {
          if (d.day === dayNum) {
            const isCompleted = d.completedTaskIndices.includes(taskIdx);
            return {
              ...d,
              completedTaskIndices: isCompleted
                ? d.completedTaskIndices.filter(i => i !== taskIdx)
                : [...d.completedTaskIndices, taskIdx]
            };
          }
          return d;
        })
      };
    });
  };

  const handleSaveToTracker = async () => {
    if (!result || isSaved) return;
    
    const existingApp = await storage.getApplicationByJDId(result.id);
    if (existingApp) {
      setIsSaved(true);
      return;
    }

    const newApp: ApplicationCard = {
      id: crypto.randomUUID(),
      parsedJDId: result.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "Saved",
      notes: { recruiterName: "", interviewDate: "", hiringManager: "", keyThemes: "", questionsToAsk: "", postInterviewNotes: "" },
      role: result.role,
      company: result.company,
      location: result.location
    };

    await storage.saveApplication(newApp);
    setIsSaved(true);
    toast.success("Saved to tracker", { description: `${result.role} at ${result.company}` });
  };

  // Helpers
  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Calculate Plan Progress
  let totalTasks = 0;
  let completedTasks = 0;
  if (prepPlan) {
    prepPlan.days.forEach(d => {
      totalTasks += d.tasks.length;
      completedTasks += d.completedTaskIndices.length;
    });
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* LEFT: main content */}
          <div className="space-y-8">

        {/* STAGE 1: JD INPUT */}
        <div className={`transition-opacity duration-500 ${result ? "hidden opacity-0" : "opacity-100"}`}>
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-zinc-500 mb-3">
              <Home className="w-3.5 h-3.5" />
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Parse JD</span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
              Parse a Job Description
            </h1>
            <p className="text-zinc-400">
              Paste any JD below. We&apos;ll extract the role, requirements, keywords, and red flags.
            </p>
          </div>

          <div className="space-y-4">
            {/* Mode toggle */}
            <div className="inline-flex p-1 rounded-xl glass border border-white/[0.06] mb-6">
              <button
                onClick={() => setJdInputMode("paste")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  jdInputMode === "paste"
                    ? "bg-violet-500/20 text-violet-200 shadow-[0_0_0_1px_rgba(167,139,250,0.3)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Paste Text
              </button>
              <button
                onClick={() => setJdInputMode("url")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  jdInputMode === "url"
                    ? "bg-violet-500/20 text-violet-200 shadow-[0_0_0_1px_rgba(167,139,250,0.3)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Import from URL
              </button>
            </div>

            {/* Success banner (shown in paste mode after successful import) */}
            {importSuccess && jdInputMode === "paste" && (
              <div className="flex items-center justify-between rounded-md bg-[#A78BFA]/10 px-3 py-2">
                <span className="text-sm text-[#A78BFA]">
                  ✓ Imported {importSuccess.charCount.toLocaleString()} chars from {importSuccess.source.charAt(0).toUpperCase() + importSuccess.source.slice(1)}
                </span>
                <button onClick={() => setImportSuccess(null)} className="text-[#A78BFA]/60 hover:text-[#A78BFA] ml-3">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* PASTE MODE */}
            {jdInputMode === "paste" && (
              <>
                <div className="rounded-2xl glass input-focus-glow border border-white/[0.08] overflow-hidden transition">
                  <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Paste the full job description here..."
                    className="w-full h-72 bg-transparent p-5 text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none text-sm leading-relaxed"
                  />
                </div>
                <div className="mt-1.5 flex justify-end">
                  <span className="kbd-hint"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> to parse</span>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                      <span>{charCount} / 100 chars minimum</span>
                      {charCount >= 100 && <span className="text-green-400">✓ Ready</span>}
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
                        style={{ width: `${Math.min((charCount / 100) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleParse}
                    disabled={!canSubmit}
                    className="btn-glow px-6 py-3 rounded-full text-white font-medium inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {loading ? 'Parsing...' : 'Parse JD'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {loading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                  </div>
                )}

                {error && (
                  <Alert variant="destructive" className="mt-4 border-destructive/50 bg-destructive/10 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {/* URL IMPORT MODE */}
            {jdInputMode === "url" && (
              <div className="space-y-3">
                <input
                  type="url"
                  value={jdUrl}
                  onChange={(e) => setJdUrl(e.target.value)}
                  placeholder="Paste a Greenhouse, Lever, or Workday URL..."
                  className="w-full bg-[#0A0A0A] border border-[#262626] rounded-md p-3 text-sm text-[#FAFAFA] placeholder-[#52525B] focus:border-[#A78BFA] focus:outline-none transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && isValidURL(jdUrl) && !isImporting && handleImportURL()}
                />

                <div className="text-xs text-[#A1A1AA]">
                  Supported: <span className="text-[#FAFAFA]">Greenhouse</span>, <span className="text-[#FAFAFA]">Lever</span>, <span className="text-[#FAFAFA]">Workday</span>. LinkedIn and Indeed not supported — paste text instead.
                </div>

                <Button
                  onClick={handleImportURL}
                  disabled={!isValidURL(jdUrl) || isImporting}
                  className="transition-all duration-300"
                >
                  {isImporting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</>
                  ) : (
                    <><Download className="w-4 h-4 mr-2" />Import JD</>
                  )}
                </Button>

                {/* Error message */}
                {importError && (
                  <div className="flex items-start justify-between rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 gap-2 mt-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-red-400">{importError}</span>
                    </div>
                    <button onClick={() => setImportError(null)} className="text-red-400/60 hover:text-red-400 ml-1 shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* STAGE 2: RESULTS */}
        {result && (
          <motion.div 
            ref={resultsRef} 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            
            {/* --- JD RESULTS SECTION --- */}
            <div className="space-y-5">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#262626]">
                <button onClick={handleReset} className="text-sm text-[#A1A1AA] hover:text-white transition-colors inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Parse another JD
                </button>
                {isSaved ? (
                  <span className="text-xs text-green-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Saved to your tracker
                  </span>
                ) : (
                  <button onClick={handleSaveToTracker} className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1.5 font-medium">
                    <Bookmark className="w-3.5 h-3.5" />
                    Save to Tracker
                  </button>
                )}
              </div>

              <div className="bg-[#111111]/80 backdrop-blur-xl border border-[#262626] rounded-xl p-7">
                {result.role === "Unknown" && (
                  <Alert className="mb-6 border-amber-500/50 bg-amber-500/10 text-amber-500">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>This doesn&apos;t look like a typical job description. Results may be inaccurate.</AlertDescription>
                  </Alert>
                )}
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                  <Briefcase className="w-5 h-5 text-violet-300" />
                </div>
                <h1 className="text-3xl font-semibold text-white tracking-tight">{result.role}</h1>
                <div className="flex items-center gap-2 text-sm text-[#A1A1AA] mt-2">
                  <span className="text-white font-medium">{result.company === "Unknown" ? <span className="italic">Company not specified</span> : result.company}</span>
                  <span className="text-[#404040]">•</span>
                  <span>{result.location === "Unknown" ? <span className="italic">Location not specified</span> : result.location}</span>
                </div>
                
                <div className="h-px bg-[#262626] my-5" />
                
                <p className="text-[15px] text-[#D4D4D8] leading-relaxed mb-5">
                  {result.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Must-Haves */}
                <div className="bg-[#111111]/80 backdrop-blur-xl border border-[#262626] rounded-xl p-7 h-full">
                  <div className="flex items-center gap-2 mb-5">
                    <CheckCircle2 className="w-4 h-4 text-violet-400" />
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Must-Haves</h3>
                  </div>
                  <ul className="space-y-3">
                    {result.mustHaves.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-[15px] text-[#D4D4D8] leading-relaxed">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Nice-to-Haves */}
                <div className="bg-[#111111]/80 backdrop-blur-xl border border-[#262626] rounded-xl p-7 h-full">
                  <div className="flex items-center gap-2 mb-5">
                    <Plus className="w-4 h-4 text-[#A1A1AA]" />
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Nice-to-Haves</h3>
                  </div>
                  <ul className="space-y-3">
                    {result.niceToHaves.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-[15px] text-[#D4D4D8] leading-relaxed">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#525252] mt-2 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-[#111111]/80 backdrop-blur-xl border border-[#262626] rounded-xl p-7">
                <div className="flex items-center gap-2 mb-5">
                  <Tags className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Keywords</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.keywords.map((keyword, i) => (
                    <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-violet-500/5 border border-violet-500/20 text-violet-200 hover:bg-violet-500/10 hover:border-violet-500/40 transition-all duration-150">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {result.redFlags.length > 0 ? (
                <div className="bg-[#111111]/80 backdrop-blur-xl border border-amber-500/20 rounded-xl p-7">
                  <div className="flex items-center gap-2 mb-5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Red Flags</h3>
                  </div>
                  <ul className="space-y-3">
                    {result.redFlags.map((flag, i) => (
                      <li key={i} className="flex items-start gap-3 text-[15px] text-[#D4D4D8] leading-relaxed">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-[#111111]/80 backdrop-blur-xl border border-green-500/20 rounded-xl p-5">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4.5 h-4.5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">No Red Flags Detected</div>
                    <div className="text-xs text-[#A1A1AA] mt-0.5">This role looks clean based on JD analysis.</div>
                  </div>
                </div>
              )}
            </div>

            {/* --- RESUME SECTION --- */}
            <div ref={analysisRef}>
              <ResumeSection 
                parsedJD={result}
                resumeText={resumeText}
                onResumeTextChange={setResumeText}
                onAnalyze={handleAnalyze}
                isAnalyzing={analyzing}
                resumeAnalysis={resumeAnalysis}
                analyzeError={analyzeError}
                setResumeAnalysis={setResumeAnalysis}
                copiedId={copiedId}
                copyText={copyText}
              />
            </div>

            {/* --- COLD OUTREACH SECTION --- */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-[#111111]/80 backdrop-blur-xl border border-[#262626] rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5 text-violet-300" />
                </div>
                <span className="text-xs font-medium text-violet-300 uppercase tracking-wider">Step 4</span>
              </div>
              
              <h2 className="text-2xl font-semibold text-white tracking-tight">LinkedIn Outreach</h2>
              <p className="text-sm text-[#A1A1AA] mt-1">Generate a connection request + follow-up DM tailored to this role.</p>
              
              <div className="h-px bg-[#262626] my-5" />

              {!outreach || isEditingOutreach ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider mb-2 block">
                      Your background <span className="text-[#525252] normal-case">(optional)</span>
                    </label>
                    <textarea
                      value={userBackground}
                      onChange={(e) => setUserBackground(e.target.value)}
                      onKeyDown={handleOutreachKeyDown}
                      placeholder="e.g., Ex-engineer with 3 yrs at fintech startups, transitioning into PM via APM programs"
                      className="min-h-[100px] bg-[#0A0A0A] border border-[#262626] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#525252] focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all w-full resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider mb-2 block">
                      Tone
                    </label>
                    <div className="flex items-center gap-2">
                      {(["Warm", "Professional", "Bold"] as OutreachTone[]).map(t => {
                        const isSelected = outreachTone === t;
                        return (
                          <button
                            key={t}
                            onClick={() => setOutreachTone(t)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                              isSelected
                                ? "bg-violet-500/15 border-violet-500/40 text-violet-200 shadow-[0_0_15px_-5px_rgba(167,139,250,0.4)]"
                                : "bg-transparent border-[#262626] text-[#A1A1AA] hover:border-[#404040] hover:text-white"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-5">
                    <span className={`text-xs ${backgroundCharCount >= 20 ? (backgroundCharCount > 500 ? "text-red-500" : "text-[#A1A1AA]") : "text-[#525252]"}`}>
                      {backgroundCharCount} / 500 chars
                    </span>
                    <button 
                      onClick={handleGenerateOutreach} 
                      disabled={!canGenerateOutreach || backgroundCharCount > 500} 
                      className={`flex items-center gap-2 font-medium h-10 px-5 rounded-lg transition-all duration-200 ${
                        (!canGenerateOutreach || backgroundCharCount > 500)
                          ? "bg-violet-500 opacity-50 cursor-not-allowed text-white"
                          : "bg-violet-500 hover:bg-violet-600 text-white shadow-[0_0_20px_-5px_rgba(167,139,250,0.5)] active:scale-[0.98]"
                      } ${generatingOutreach ? "animate-pulse" : ""}`}
                    >
                      {generatingOutreach ? <><Loader2 className="w-4 h-4 animate-spin" /> Drafting messages...</> : <>Generate Outreach <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </div>
                  
                  {generatingOutreach && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <CardSkeleton />
                      <CardSkeleton />
                    </div>
                  )}

                  {outreachError && (
                    <Alert variant="destructive" className="mt-4 border-destructive/50 bg-destructive/10 text-destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{outreachError}</AlertDescription></Alert>
                  )}
                </div>
              ) : (
                <div ref={outreachRef} className="space-y-6 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-card border-border flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Connection Request</CardTitle>
                        <Badge variant="outline" className={outreach.connectionNote.length <= 300 ? "border-green-500/50 text-green-500 bg-green-500/10" : "border-red-500/50 text-red-500 bg-red-500/10"}>
                          {outreach.connectionNote.length} / 300 chars
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-6 pt-2 flex-1 flex flex-col">
                        <div className="bg-muted/30 p-4 rounded-md font-mono text-sm leading-relaxed mb-4 flex-1 whitespace-pre-wrap">
                          {outreach.connectionNote}
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <p className="text-xs text-muted-foreground">Send this when sending a connection request on LinkedIn.</p>
                          <Button variant="ghost" size="sm" onClick={() => copyText("conn", outreach.connectionNote)}>
                            {copiedId === "conn" ? <><Check className="h-4 w-4 mr-2 text-green-500" /> Copied!</> : <><Copy className="h-4 w-4 mr-2" /> Copy</>}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-border flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Follow-up DM</CardTitle>
                        <Badge variant="outline" className="border-border text-muted-foreground">{outreach.followUpDM.length} chars</Badge>
                      </CardHeader>
                      <CardContent className="p-6 pt-2 flex-1 flex flex-col">
                        <div className="bg-muted/30 p-4 rounded-md font-mono text-sm leading-relaxed mb-4 flex-1 whitespace-pre-wrap">
                          {outreach.followUpDM}
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <p className="text-xs text-muted-foreground">Send this once they accept your connection.</p>
                          <Button variant="ghost" size="sm" onClick={() => copyText("dm", outreach.followUpDM)}>
                            {copiedId === "dm" ? <><Check className="h-4 w-4 mr-2 text-green-500" /> Copied!</> : <><Copy className="h-4 w-4 mr-2" /> Copy</>}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="flex justify-center gap-4 pt-4">
                    <Button variant="ghost" onClick={() => setIsEditingOutreach(true)}>Edit Inputs</Button>
                    <Button variant="ghost" onClick={handleGenerateOutreach} disabled={generatingOutreach}>
                      {generatingOutreach ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Regenerate"}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* --- 7-DAY PREP PLAN SECTION --- */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-[#111111]/80 backdrop-blur-xl border border-[#262626] rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <CalendarDays className="w-3.5 h-3.5 text-violet-300" />
                </div>
                <span className="text-xs font-medium text-violet-300 uppercase tracking-wider">Step 5</span>
              </div>
              
              <h2 className="text-2xl font-semibold text-white tracking-tight">7-Day Interview Prep Plan</h2>
              <p className="text-sm text-[#A1A1AA] mt-1">A personalized day-by-day plan to prepare for this specific role.</p>
              
              <div className="h-px bg-[#262626] my-5" />

              {!prepPlan ? (
                <div className="space-y-6">
                  <div className="bg-[#0A0A0A] border border-[#1f1f1f] rounded-lg p-4 space-y-2">
                    <div className="flex items-start gap-2 text-sm text-[#A1A1AA]"><div className="w-1 h-1 rounded-full bg-violet-400 mt-2 shrink-0" /><span>Day 1-2: Company & product deep dive</span></div>
                    <div className="flex items-start gap-2 text-sm text-[#A1A1AA]"><div className="w-1 h-1 rounded-full bg-violet-400 mt-2 shrink-0" /><span>Day 3-4: Frameworks & case prep</span></div>
                    <div className="flex items-start gap-2 text-sm text-[#A1A1AA]"><div className="w-1 h-1 rounded-full bg-violet-400 mt-2 shrink-0" /><span>Day 5-6: Mock interviews & STAR drills</span></div>
                    <div className="flex items-start gap-2 text-sm text-[#A1A1AA]"><div className="w-1 h-1 rounded-full bg-violet-400 mt-2 shrink-0" /><span>Day 7: Final review & questions to ask</span></div>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      onClick={handleGeneratePlan} 
                      disabled={generatingPlan} 
                      className={`flex items-center gap-2 font-medium h-10 px-5 rounded-lg transition-all duration-200 ${
                        generatingPlan
                          ? "bg-violet-500 opacity-50 cursor-not-allowed text-white animate-pulse"
                          : "bg-violet-500 hover:bg-violet-600 text-white shadow-[0_0_20px_-5px_rgba(167,139,250,0.5)] active:scale-[0.98]"
                      }`}
                    >
                      {generatingPlan ? <><Loader2 className="w-4 h-4 animate-spin" /> Building your plan...</> : <>Generate Plan <Sparkles className="w-4 h-4" /></>}
                    </button>
                  </div>
                  
                  {generatingPlan && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-6">
                      <PlanDaySkeleton />
                      <PlanDaySkeleton />
                      <PlanDaySkeleton />
                      <PlanDaySkeleton />
                      <PlanDaySkeleton />
                      <PlanDaySkeleton />
                      <PlanDaySkeleton />
                    </div>
                  )}

                  {planError && (
                    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 text-destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{planError}</AlertDescription></Alert>
                  )}
                </div>
              ) : (
                <div ref={planRef} className="space-y-8 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {prepPlan.days.map((day) => (
                      <Card key={day.day} className="bg-card border-border">
                        <CardHeader className="flex flex-row items-center gap-4 pb-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-500/20 text-violet-500 font-bold">
                            D{day.day}
                          </div>
                          <CardTitle className="text-xl flex-1">{day.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-3">
                          {day.tasks.map((task, idx) => {
                            const isChecked = day.completedTaskIndices.includes(idx);
                            return (
                              <div key={idx} className="flex items-start gap-3 group cursor-pointer" onClick={() => toggleTask(day.day, idx)}>
                                <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-violet-500 border-violet-500 text-white' : 'border-border'}`}>
                                  {isChecked && <Check className="w-3 h-3" />}
                                </div>
                                <p className={`text-base leading-relaxed transition-colors ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                  {task}
                                </p>
                              </div>
                            );
                          })}
                          <div className="flex justify-end pt-2">
                            <span className={`text-xs font-medium ${day.completedTaskIndices.length === day.tasks.length ? "text-green-500" : "text-muted-foreground"}`}>
                              {day.completedTaskIndices.length} / {day.tasks.length} done
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="bg-card border border-border p-6 rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">Overall Progress</span>
                      <span className={`font-bold text-lg ${completedTasks === totalTasks ? "text-green-500" : "text-violet-500"}`}>
                        {completedTasks} / {totalTasks} tasks completed
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-violet-500 h-full transition-all duration-500 ease-out" 
                        style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button variant="ghost" onClick={handleRegeneratePlan} disabled={generatingPlan}>
                      {generatingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Regenerate Plan"}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>

            <footer className="pt-8 pb-4 text-center">
            </footer>
          </motion.div>
        )}
          </div>

          {/* RIGHT: helper sidebar */}
          <aside className="space-y-4">
            {/* Tips card */}
            <div className="glass rounded-xl p-5 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Lightbulb className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Tips for best results</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-[13px] text-[#A1A1AA] leading-relaxed">
                  <div className="w-1 h-1 rounded-full bg-violet-400 mt-2 flex-shrink-0" />
                  <span>Paste the full JD, not just bullet points</span>
                </li>
                <li className="flex items-start gap-3 text-[13px] text-[#A1A1AA] leading-relaxed">
                  <div className="w-1 h-1 rounded-full bg-violet-400 mt-2 flex-shrink-0" />
                  <span>Include &quot;Responsibilities&quot; + &quot;Requirements&quot; sections</span>
                </li>
                <li className="flex items-start gap-3 text-[13px] text-[#A1A1AA] leading-relaxed">
                  <div className="w-1 h-1 rounded-full bg-violet-400 mt-2 flex-shrink-0" />
                  <span>200+ words gives the most accurate extraction</span>
                </li>
              </ul>
            </div>

            {/* Workflow steps */}
            <div className="glass rounded-xl p-5 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Workflow</h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { step: "1", label: "Parse JD", done: !!result },
                  { step: "2", label: "Analyze Resume", done: !!resumeAnalysis },
                  { step: "3", label: "Generate Outreach", done: !!outreach },
                  { step: "4", label: "Create Prep Plan", done: !!prepPlan },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                      item.done 
                        ? "bg-violet-500/20 border-violet-500/40 text-violet-300" 
                        : "bg-white/[0.03] border-white/[0.08] text-zinc-500"
                    }`}>
                      {item.done ? <Check className="w-3 h-3" /> : item.step}
                    </div>
                    <span className={`text-[13px] ${item.done ? "text-white" : "text-zinc-500"}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ParsePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ParsePageContent />
    </Suspense>
  );
}

export default ParsePageWrapper;
