"use client";

import { useState, KeyboardEvent, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, ArrowLeft, Loader2, Copy, Check } from "lucide-react";
import { storage } from "@/lib/storage/localStorage";
import { ParsedJD, ResumeAnalysis, OutreachTone, ColdOutreach, PrepPlan, ApplicationCard } from "@/types";
import { CardSkeleton, PlanDaySkeleton } from "@/components/shared/Skeleton";
import dynamic from "next/dynamic";
import { ResumeSection } from "@/components/parse/ResumeSection";

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

  const resumeCharCount = resumeText.length;
  const canAnalyze = resumeCharCount >= 200 && !analyzing;

  const backgroundCharCount = userBackground.length;
  const canGenerateOutreach = backgroundCharCount >= 20 && !generatingOutreach;

  // Initial Hydration
  useEffect(() => {
    if (storage.isSessionCleared()) return;

    const requestedJDId = searchParams.get("resume");
    
    if (requestedJDId) {
      const jd = storage.getParsedJDById(requestedJDId);
      if (jd) {
        setResult(jd);
        const analysis = storage.getResumeAnalysisByJDId(requestedJDId);
        if (analysis) setResumeAnalysis(analysis);
        
        const outreachData = storage.getOutreachByJDId(requestedJDId);
        if (outreachData) setOutreach(outreachData);
        
        const plan = storage.getPrepPlanByJDId(requestedJDId);
        if (plan) setPrepPlan(plan);
        return;
      }
    }

    const recentJDs = storage.getParsedJDs();
    if (recentJDs.length > 0) {
      const latest = recentJDs[0];
      setResult(latest);
      
      const analysis = storage.getResumeAnalysisByJDId(latest.id);
      if (analysis) setResumeAnalysis(analysis);
      
      const outreachData = storage.getOutreachByJDId(latest.id);
      if (outreachData) setOutreach(outreachData);
      
      const plan = storage.getPrepPlanByJDId(latest.id);
      if (plan) setPrepPlan(plan);
    }
  }, [searchParams]);

  // Secondary Hydration (for when result changes within the page)
  useEffect(() => {
    if (result) {
      const storedOutreach = storage.getOutreachByJDId(result.id);
      if (storedOutreach) setOutreach(storedOutreach);

      const storedPlan = storage.getPrepPlanByJDId(result.id);
      if (storedPlan) setPrepPlan(storedPlan);
      
      const storedApp = storage.getApplicationByJDId(result.id);
      setIsSaved(!!storedApp);
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
      storage.saveParsedJD(data.data);
      storage.clearSessionCleared();

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
    storage.setSessionCleared();
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
      storage.saveResumeAnalysis(data.data);

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
      storage.saveOutreach(data.data);
      setIsEditingOutreach(false);

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
      storage.savePrepPlan(data.data);

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

  const toggleTask = (dayNum: number, taskIdx: number) => {
    if (!prepPlan) return;
    storage.toggleTaskCompletion(prepPlan.id, dayNum, taskIdx);
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

  // Tracker Handlers
  const handleSaveToTracker = () => {
    if (!result || isSaved) return;
    
    const existingApp = storage.getApplicationByJDId(result.id);
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

    storage.saveApplication(newApp);
    setIsSaved(true);
  };

  // Helpers
  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
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
      <div className="max-w-5xl mx-auto space-y-8">

        {/* STAGE 1: JD INPUT */}
        <div className={`transition-opacity duration-500 ${result ? "hidden opacity-0" : "opacity-100"}`}>
          <div className="space-y-2 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Parse a Job Description</h1>
            <p className="text-muted-foreground">
              Paste any JD below. We&apos;ll extract the role, requirements, keywords, and red flags.
            </p>
          </div>

          <div className="space-y-4">
            <Textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste the full job description here..."
              className="min-h-[300px] resize-y bg-card border-border focus-visible:ring-primary text-base p-4"
            />

            <div className="flex justify-between items-center">
              <span className={`text-sm ${charCount >= 100 ? "text-primary" : "text-muted-foreground"}`}>
                {charCount} / 100 chars
              </span>
              <Button onClick={handleParse} disabled={!canSubmit} className={`transition-all duration-300 ${loading ? "animate-pulse" : ""}`}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
                ) : (
                  "Parse JD"
                )}
              </Button>
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
          </div>
        </div>

        {/* STAGE 2: RESULTS */}
        {result && (
          <div ref={resultsRef} className="transition-opacity duration-500 opacity-100 space-y-16">
            
            {/* --- JD RESULTS SECTION --- */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={handleReset} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Parse another JD
                </Button>
                <span className="text-sm text-muted-foreground flex items-center">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Saved to your tracker
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="col-span-1 md:col-span-2 bg-card border-border">
                  <CardContent className="p-6">
                    {result.role === "Unknown" && (
                      <Alert className="mb-6 border-amber-500/50 bg-amber-500/10 text-amber-500">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>This doesn&apos;t look like a typical job description. Results may be inaccurate.</AlertDescription>
                      </Alert>
                    )}
                    <h2 className="text-3xl font-bold mb-2">{result.role}</h2>
                    <p className="text-lg text-muted-foreground mb-4">
                      {result.company === "Unknown" ? <span className="italic">Company not specified</span> : result.company}
                      {" • "}
                      {result.location === "Unknown" ? <span className="italic">Location not specified</span> : result.location}
                    </p>
                    <p className="text-lg">{result.summary}</p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border"><CardHeader><CardTitle>Must-Haves</CardTitle></CardHeader><CardContent className="p-6 pt-0"><ul className="space-y-2">{result.mustHaves.map((item, i) => (<li key={i} className="flex items-start"><span className="text-primary mr-2 mt-1">•</span><span>{item}</span></li>))}</ul></CardContent></Card>
                <Card className="bg-card border-border"><CardHeader><CardTitle>Nice-to-Haves</CardTitle></CardHeader><CardContent className="p-6 pt-0"><ul className="space-y-2">{result.niceToHaves.map((item, i) => (<li key={i} className="flex items-start"><span className="text-primary mr-2 mt-1">•</span><span>{item}</span></li>))}</ul></CardContent></Card>
                <Card className="col-span-1 md:col-span-2 bg-card border-border"><CardHeader><CardTitle>Keywords</CardTitle></CardHeader><CardContent className="p-6 pt-0 flex flex-wrap gap-2">{result.keywords.map((keyword, i) => (<Badge key={i} variant="outline" className="border-primary text-primary bg-primary/10">{keyword}</Badge>))}</CardContent></Card>
                <Card className={`col-span-1 md:col-span-2 ${result.redFlags.length > 0 ? "border-amber-500/50 bg-amber-500/5" : "border-emerald-500/50 bg-emerald-500/5"}`}><CardHeader><CardTitle className="flex items-center">{result.redFlags.length > 0 ? <><AlertTriangle className="mr-2 text-amber-500" /> Red Flags</> : <><CheckCircle2 className="mr-2 text-emerald-500" /> No Red Flags</>}</CardTitle></CardHeader><CardContent className="p-6 pt-0">{result.redFlags.length > 0 ? (<ul className="space-y-2">{result.redFlags.map((flag, i) => (<li key={i} className="flex items-start text-amber-500/90"><span className="mr-2 text-amber-500 mt-1">•</span><span>{flag}</span></li>))}</ul>) : (<p className="text-emerald-500/90">&#10003; No red flags detected</p>)}</CardContent></Card>
              </div>
              
              <div className="flex justify-center mt-8">
                <Button 
                  variant="outline" 
                  onClick={handleSaveToTracker} 
                  disabled={isSaved}
                  className={`transition-all duration-300 ${isSaved ? "text-green-500 border-green-500/50 bg-green-500/10" : "hover:bg-violet-500/10 hover:text-violet-500 hover:border-violet-500/50"}`}
                >
                  {isSaved ? <><CheckCircle2 className="mr-2 h-4 w-4" /> In Tracker</> : "Save to Tracker"}
                </Button>
              </div>
            </div>

            <div className="h-px bg-border w-full" />

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

            <div className="h-px bg-border w-full" />

            {/* --- COLD OUTREACH SECTION --- */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">LinkedIn Outreach</h2>
                <p className="text-muted-foreground">Generate a connection request + follow-up DM tailored to this role.</p>
              </div>

              {!outreach || isEditingOutreach ? (
                <div className="space-y-4">
                  <Textarea
                    value={userBackground}
                    onChange={(e) => setUserBackground(e.target.value)}
                    onKeyDown={handleOutreachKeyDown}
                    placeholder="e.g., Ex-engineer with 3 yrs at fintech startups, transitioning into PM via APM programs"
                    className="min-h-[60px] resize-y bg-card border-border focus-visible:ring-primary text-base p-4"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className={`text-sm ${backgroundCharCount >= 20 ? (backgroundCharCount > 500 ? "text-red-500" : "text-violet-500") : "text-muted-foreground"}`}>
                        {backgroundCharCount} / 500 chars
                      </span>
                      <div className="flex gap-2">
                        {(["Warm", "Professional", "Bold"] as OutreachTone[]).map(t => (
                          <button
                            key={t}
                            onClick={() => setOutreachTone(t)}
                            className={`px-3 py-1 rounded-full text-sm transition-colors border ${outreachTone === t ? "bg-violet-500 text-white border-violet-500" : "border-border text-foreground hover:bg-muted"}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleGenerateOutreach} disabled={!canGenerateOutreach || backgroundCharCount > 500} className={`transition-all duration-300 ${generatingOutreach ? "animate-pulse" : ""}`}>
                      {generatingOutreach ? <><Loader2 className="mr-2 h-4 w-4 animate-spin text-violet-500" />Drafting messages...</> : "Generate Outreach"}
                    </Button>
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
            </div>

            <div className="h-px bg-border w-full" />

            {/* --- 7-DAY PREP PLAN SECTION --- */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">7-Day Interview Prep Plan</h2>
                <p className="text-muted-foreground">A personalized day-by-day plan to prepare for this specific role.</p>
              </div>

              {!prepPlan ? (
                <div className="flex flex-col items-start gap-4">
                  <Button onClick={handleGeneratePlan} disabled={generatingPlan} className={`bg-violet-600 hover:bg-violet-700 text-white transition-all duration-300 ${generatingPlan ? "animate-pulse" : ""}`}>
                    {generatingPlan ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Building your plan...</> : "Generate Prep Plan"}
                  </Button>
                  
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
            </div>

            <footer className="pt-8 pb-4 text-center">
              <p className="text-sm text-muted-foreground">All data is saved locally to your browser.</p>
            </footer>
          </div>
        )}
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

const ParsePage = dynamic(() => Promise.resolve(ParsePageWrapper), {
  ssr: false,
});

export default ParsePage;
