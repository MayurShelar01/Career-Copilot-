"use client";

import { useState, KeyboardEvent, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, ArrowLeft, Copy, Check, Edit2, FileText, Trash2, X, Upload, XCircle } from "lucide-react";
import { ParsedJD, ResumeAnalysis, TailoredBullet, ResumeVersion } from "@/types";
import { CardSkeleton, BulletSkeleton } from "@/components/shared/Skeleton";
import { storage } from "@/lib/storage/storage";
import { relativeTime } from "@/lib/utils";

interface ResumeSectionProps {
  parsedJD: ParsedJD;
  resumeText: string;
  onResumeTextChange: (text: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  resumeAnalysis: ResumeAnalysis | null;
  analyzeError: string | null;
  setResumeAnalysis: (analysis: ResumeAnalysis | null) => void;
  copiedId: string | null;
  copyText: (id: string, text: string) => void;
}

export function ResumeSection({
  resumeText,
  onResumeTextChange,
  onAnalyze,
  isAnalyzing,
  resumeAnalysis,
  analyzeError,
  setResumeAnalysis,
  copiedId,
  copyText,
}: ResumeSectionProps) {
  // Local state for bullet editing
  const [editingBulletId, setEditingBulletId] = useState<string | null>(null);
  const [editBulletText, setEditBulletText] = useState("");
  const analysisRef = useRef<HTMLDivElement>(null);

  // Resume Version Manager State
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState<ResumeVersion | null>(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveFormName, setSaveFormName] = useState("");
  const [showLibraryPanel, setShowLibraryPanel] = useState(false);
  const [isEditingName, setIsEditingName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [showSaveConfirmation, setShowSaveConfirmation] = useState("");

  // PDF Upload State
  // fileInputRef is the ONE allowed useRef — only used to call .click(), NOT to read state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractWarnings, setExtractWarnings] = useState<string[]>([]);
  const [showExtractSuccess, setShowExtractSuccess] = useState<{ pageCount: number; charCount: number } | null>(null);

  const isEdited = activeVersion !== null && resumeText !== activeVersion.content;
  const resumeCharCount = resumeText.length;
  const canAnalyze = resumeCharCount >= 200 && !isAnalyzing;

  useEffect(() => {
    const fetchVersions = async () => {
      setVersions(await storage.getResumeVersions());
    };
    fetchVersions();
  }, []);

  const handleResumeKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (canAnalyze) onAnalyze();
    }
  };

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setExtractError(null);
    setExtractWarnings([]);
    setShowExtractSuccess(null);

    try {
      // Dynamically import to avoid SSR bundling issues
      const { extractTextFromPDF } = await import("@/lib/pdf/extractText");
      const result = await extractTextFromPDF(file);

      // Confirm replace only if textarea already has content
      if (resumeText.trim().length > 0) {
        const confirmed = window.confirm("Replace current resume content with extracted PDF text?");
        if (!confirmed) {
          setIsExtracting(false);
          e.target.value = "";
          return;
        }
      }

      onResumeTextChange(result.text);
      setExtractWarnings(result.warnings);

      setShowExtractSuccess({ pageCount: result.pageCount, charCount: result.text.length });
      setTimeout(() => setShowExtractSuccess(null), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to parse PDF";
      setExtractError(message);
    } finally {
      setIsExtracting(false);
      e.target.value = ""; // reset so same file can be re-selected
    }
  };

  const startEditing = (bullet: TailoredBullet) => {
    setEditingBulletId(bullet.id);
    setEditBulletText(bullet.text);
  };

  const saveBullet = async (bulletId: string) => {
    if (!resumeAnalysis) return;
    await storage.updateBulletText(resumeAnalysis.id, bulletId, editBulletText);
    
    setResumeAnalysis({
      ...resumeAnalysis,
      bullets: resumeAnalysis.bullets.map(b => 
        b.id === bulletId ? { ...b, text: editBulletText } : b
      )
    });
    setEditingBulletId(null);
  };

  const getMatchStyles = (label: string) => {
    switch (label) {
      case "Strong": return "text-green-400 bg-green-500/10 border-green-500/30";
      case "Partial": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "Weak": return "text-red-400 bg-red-500/10 border-red-500/30";
      default: return "";
    }
  };

  const handleSaveVersion = async () => {
    if (!saveFormName.trim() || !resumeText.trim()) return;
    const newVersion = await storage.saveResumeVersion(saveFormName.trim(), resumeText);
    setVersions(await storage.getResumeVersions());
    setActiveVersion(newVersion);
    setShowSaveForm(false);
    setSaveFormName("");
    
    setShowSaveConfirmation(`✓ Saved as '${newVersion.name}'`);
    setTimeout(() => setShowSaveConfirmation(""), 2000);
  };

  const handleUpdateVersion = async () => {
    if (!activeVersion) return;
    await storage.updateResumeVersion(activeVersion.id, { content: resumeText });
    const now = new Date().toISOString();
    setActiveVersion({ ...activeVersion, content: resumeText, updatedAt: now });
    setVersions(await storage.getResumeVersions());
    
    setShowSaveConfirmation(`✓ Updated '${activeVersion.name}'`);
    setTimeout(() => setShowSaveConfirmation(""), 2000);
  };

  const handleSelectVersion = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      setActiveVersion(null);
      onResumeTextChange("");
      return;
    }
    const version = versions.find(v => v.id === id);
    if (!version) return;

    if (resumeText.length > 0 && resumeText !== version.content) {
      if (!window.confirm("Replace current resume? Unsaved changes will be lost.")) return;
    }
    
    setActiveVersion(version);
    onResumeTextChange(version.content);
  };

  const handleLoadVersion = (version: ResumeVersion) => {
    if (resumeText.length > 0 && resumeText !== version.content) {
      if (!window.confirm("Replace current resume? Unsaved changes will be lost.")) return;
    }
    setActiveVersion(version);
    onResumeTextChange(version.content);
    setShowLibraryPanel(false);
  };

  const handleDeleteVersion = async (id: string) => {
    if (!window.confirm("Delete this saved resume?")) return;
    await storage.deleteResumeVersion(id);
    setVersions(await storage.getResumeVersions());
    if (activeVersion?.id === id) {
      setActiveVersion(null);
    }
  };

  const startEditingName = (v: ResumeVersion) => {
    setIsEditingName(v.id);
    setEditNameValue(v.name);
  };

  const saveEditedName = async (id: string) => {
    if (editNameValue.trim()) {
      await storage.updateResumeVersion(id, { name: editNameValue.trim() });
      setVersions(await storage.getResumeVersions());
      if (activeVersion?.id === id) {
        setActiveVersion({ ...activeVersion, name: editNameValue.trim() });
      }
    }
    setIsEditingName(null);
  };

  return (
    <>
      {!resumeAnalysis ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Analyze Your Resume Against This JD</h2>
            <p className="text-muted-foreground">Paste your resume below. We&apos;ll show your match strength, missing keywords, and generate tailored bullets you can copy-paste.</p>
          </div>

          <div className="space-y-4">
            {/* Version Manager Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <select 
                  className="bg-[#0A0A0A] border border-[#262626] text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-[#A78BFA] transition-colors"
                  value={activeVersion?.id || ""}
                  onChange={handleSelectVersion}
                  disabled={versions.length === 0}
                >
                  <option value="">-- Use saved resume --</option>
                  {versions.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} (Updated {relativeTime(v.updatedAt)})
                    </option>
                  ))}
                  {versions.length === 0 && <option value="" disabled>No saved resumes yet</option>}
                </select>
                
                {isEdited && (
                  <span className="text-amber-400 text-xs font-medium">• edited</span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {showSaveConfirmation && (
                  <span className="text-violet-400 text-sm animate-in fade-in mr-2">{showSaveConfirmation}</span>
                )}

                {isEdited && activeVersion && (
                  <Button variant="outline" size="sm" onClick={handleUpdateVersion} className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10">
                    Update version
                  </Button>
                )}

                {/* Hidden file input — useRef only to trigger .click(), state flows through onChange */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handlePDFUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10"
                  disabled={isExtracting}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isExtracting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Extracting...</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" />Upload PDF</>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10"
                  disabled={resumeCharCount < 200}
                  onClick={() => setShowSaveForm(true)}
                >
                  Save as version
                </Button>

                {versions.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setShowLibraryPanel(!showLibraryPanel)} className="text-muted-foreground">
                    Manage
                  </Button>
                )}
              </div>
            </div>

            {/* PDF extraction status messages */}
            {showExtractSuccess && (
              <div className="mt-3 flex items-center justify-between rounded-md bg-[#A78BFA]/10 px-3 py-2">
                <span className="text-sm text-[#A78BFA]">
                  ✓ Extracted {showExtractSuccess.charCount.toLocaleString()} characters from {showExtractSuccess.pageCount} page{showExtractSuccess.pageCount !== 1 ? "s" : ""}
                </span>
                <button onClick={() => setShowExtractSuccess(null)} className="text-[#A78BFA]/60 hover:text-[#A78BFA] ml-3">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {extractWarnings.length > 0 && (
              <div className="mt-3 flex items-start justify-between rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-amber-400">{extractWarnings[0]}</span>
                </div>
                <button onClick={() => setExtractWarnings([])} className="text-amber-400/60 hover:text-amber-400 ml-1 shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {extractError && (
              <div className="mt-3 flex items-start justify-between rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 gap-2">
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-red-400">{extractError}</span>
                </div>
                <button onClick={() => setExtractError(null)} className="text-red-400/60 hover:text-red-400 ml-1 shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Inline Save Form */}
            {showSaveForm && (
              <div className="bg-[#111111] border border-[#262626] rounded-md p-3 flex items-center gap-3 animate-in fade-in">
                <input 
                  type="text" 
                  value={saveFormName}
                  onChange={(e) => setSaveFormName(e.target.value)}
                  placeholder="e.g., PM - Fintech focus"
                  className="flex-1 bg-[#0A0A0A] border border-[#262626] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-violet-500"
                  onKeyDown={(e) => e.key === "Enter" && handleSaveVersion()}
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveVersion}>Save</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowSaveForm(false)}>Cancel</Button>
              </div>
            )}

            {/* Library Panel */}
            {showLibraryPanel && versions.length > 0 && (
              <div className="bg-[#111111] border border-[#262626] rounded-md p-4 animate-in fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold">Resume Library</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowLibraryPanel(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {versions.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-2 hover:bg-[#1a1a1a] rounded group border border-transparent hover:border-[#262626] transition-colors">
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        {isEditingName === v.id ? (
                          <input 
                            className="bg-[#0A0A0A] border border-violet-500 rounded px-2 py-0.5 text-sm focus:outline-none"
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            onBlur={() => saveEditedName(v.id)}
                            onKeyDown={(e) => e.key === "Enter" && saveEditedName(v.id)}
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-medium cursor-pointer hover:text-violet-400" onClick={() => startEditingName(v)}>
                            {v.name}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">Updated {relativeTime(v.updatedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Load version" onClick={() => handleLoadVersion(v)}>
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-400" title="Delete version" onClick={() => handleDeleteVersion(v.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {versions.length === 0 && <p className="text-sm text-muted-foreground">No saved versions yet. Save your first resume above.</p>}
                </div>
              </div>
            )}

            <Textarea
              value={resumeText}
              onChange={(e) => onResumeTextChange(e.target.value)}
              onKeyDown={handleResumeKeyDown}
              placeholder="Paste your full resume text here..."
              className="min-h-[300px] resize-y bg-card border-border focus-visible:ring-primary text-base p-4"
            />
            <div className="flex justify-between items-center">
              <span className={`text-sm ${resumeCharCount >= 200 ? "text-primary" : "text-muted-foreground"}`}>{resumeCharCount} / 200 chars</span>
              <Button onClick={onAnalyze} disabled={!canAnalyze} className={`transition-all duration-300 ${isAnalyzing ? "animate-pulse" : ""}`}>
                {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : "Analyze Resume"}
              </Button>
            </div>
            
            {isAnalyzing && (
              <div className="space-y-6 mt-6">
                <CardSkeleton />
                <div className="grid grid-cols-1 gap-4">
                  <BulletSkeleton />
                  <BulletSkeleton />
                  <BulletSkeleton />
                </div>
              </div>
            )}

            {analyzeError && (
              <Alert variant="destructive" className="mt-4 border-destructive/50 bg-destructive/10 text-destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{analyzeError}</AlertDescription></Alert>
            )}
          </div>
        </div>
      ) : (
        <div ref={analysisRef} className="space-y-10 animate-in fade-in duration-500">
          <div className="space-y-2"><h2 className="text-2xl font-bold tracking-tight">Resume Gap Analysis</h2><p className="text-muted-foreground">Review your match and tailored bullets below.</p></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-1 md:col-span-2 bg-card border-border flex flex-col items-center justify-center p-8 text-center">
              <Badge variant="outline" className={`text-lg px-6 py-2 border-2 ${getMatchStyles(resumeAnalysis.gapAnalysis.matchLabel)}`}>{resumeAnalysis.gapAnalysis.matchLabel} Match</Badge>
              <p className="text-lg text-muted-foreground mt-4 max-w-2xl">{resumeAnalysis.gapAnalysis.matchReasoning}</p>
            </Card>
            <Card className="bg-card border-border"><CardHeader><CardTitle>Missing Keywords</CardTitle></CardHeader><CardContent className="p-6 pt-0 flex flex-wrap gap-2">
              {resumeAnalysis.gapAnalysis.missingKeywords.length > 0 ? resumeAnalysis.gapAnalysis.missingKeywords.map((kw, i) => (<Badge key={i} variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10">{kw}</Badge>)) : (<p className="text-muted-foreground">None! Your resume covers all key terms.</p>)}
            </CardContent></Card>
            <Card className="bg-card border-border"><CardHeader><CardTitle>Top 3 Improvements</CardTitle></CardHeader><CardContent className="p-6 pt-0"><ol className="space-y-3">
              {resumeAnalysis.gapAnalysis.topImprovements.map((imp, i) => (<li key={i} className="flex items-start"><span className="text-primary font-bold mr-3">{i + 1}.</span><span>{imp}</span></li>))}
            </ol></CardContent></Card>
          </div>
          <div className="space-y-4">
            <div className="space-y-1"><h3 className="text-xl font-bold tracking-tight">Tailored Resume Bullets</h3><p className="text-sm text-muted-foreground">Generated from your experience, optimized for this JD. Click to copy.</p></div>
            <div className="grid grid-cols-1 gap-4">
              {resumeAnalysis.bullets.map((bullet) => (
                <Card key={bullet.id} className="bg-card border-border overflow-hidden">
                  <CardContent className="p-6">
                    {editingBulletId === bullet.id ? (
                      <div className="space-y-4">
                        <Textarea value={editBulletText} onChange={(e) => setEditBulletText(e.target.value)} className="min-h-[100px]"/>
                        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditingBulletId(null)}>Cancel</Button><Button onClick={() => saveBullet(bullet.id)}>Save</Button></div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1"><p className="text-lg leading-relaxed">{bullet.text}</p><p className="text-sm text-muted-foreground">Based on: {bullet.basedOn}</p></div>
                        <div className="flex items-center gap-2 md:self-start">
                          <Button variant="ghost" size="icon" onClick={() => startEditing(bullet)} title="Edit bullet"><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" className="min-w-[100px]" onClick={() => copyText(bullet.id, bullet.text)}>
                            {copiedId === bullet.id ? <><Check className="h-4 w-4 mr-2 text-green-500" /> Copied!</> : <><Copy className="h-4 w-4 mr-2" /> Copy</>}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="pt-4 flex justify-center"><Button variant="outline" onClick={() => setResumeAnalysis(null)}><ArrowLeft className="mr-2 h-4 w-4" /> Edit Resume</Button></div>
        </div>
      )}
    </>
  );
}
