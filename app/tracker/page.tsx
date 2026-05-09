"use client";

import { useState, useEffect } from "react";
import { 
  DndContext, 
  DragOverlay, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  useDroppable,
  closestCenter
} from "@dnd-kit/core";
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ApplicationCard, ApplicationStatus, ParsedJD, ResumeAnalysis, ColdOutreach, PrepPlan, ApplicationNotes } from "@/types";
import { storage } from "@/lib/storage/storage";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Trash2, Bookmark, Inbox, Users, Trophy, XCircle, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const COLUMNS: ApplicationStatus[] = ["Saved", "Applied", "Interviewing", "Offer", "Rejected"];

const COLUMN_COLORS: Record<ApplicationStatus, string> = {
  Saved: "bg-violet-400",
  Applied: "bg-blue-400",
  Interviewing: "bg-amber-400",
  Offer: "bg-green-400",
  Rejected: "bg-red-400",
};

const COLUMN_TOP_BORDER_COLORS: Record<ApplicationStatus, string> = {
  Saved: "border-t-2 border-t-violet-500/40",
  Applied: "border-t-2 border-t-blue-500/40",
  Interviewing: "border-t-2 border-t-amber-500/40",
  Offer: "border-t-2 border-t-emerald-500/40",
  Rejected: "border-t-2 border-t-red-500/40",
};

const CARD_LEFT_BORDER: Record<ApplicationStatus, string> = {
  Saved: "border-l-2 border-l-violet-500/60",
  Applied: "border-l-2 border-l-blue-500/60",
  Interviewing: "border-l-2 border-l-amber-500/60",
  Offer: "border-l-2 border-l-emerald-500/60",
  Rejected: "border-l-2 border-l-red-500/60",
};

const COLUMN_EMPTY_ICONS: Record<ApplicationStatus, React.ReactNode> = {
  Saved: <Bookmark className="w-10 h-10 text-zinc-700 mb-2" />,
  Applied: <Inbox className="w-10 h-10 text-zinc-700 mb-2" />,
  Interviewing: <Users className="w-10 h-10 text-zinc-700 mb-2" />,
  Offer: <Trophy className="w-10 h-10 text-zinc-700 mb-2" />,
  Rejected: <XCircle className="w-10 h-10 text-zinc-700 mb-2" />,
};

// Sortable Card Component
function SortableCard({ 
  app, 
  expandedId, 
  toggleExpand, 
  deleteApp, 
  updateNotes,
  linkedData
}: { 
  app: ApplicationCard, 
  expandedId: string | null, 
  toggleExpand: (id: string) => void,
  deleteApp: (id: string) => void,
  updateNotes: (id: string, notes: ApplicationNotes) => void,
  linkedData: { jd?: ParsedJD | null, resume?: ResumeAnalysis | null, outreach?: ColdOutreach | null, plan?: PrepPlan | null }
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id, data: { type: "Application", app } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isExpanded = expandedId === app.id;
  const dateFormatted = new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  
  const [localNotes, setLocalNotes] = useState<ApplicationNotes>(app.notes);
  
  useEffect(() => {
    setLocalNotes(app.notes);
  }, [app.notes]);

  const handleFieldBlur = () => {
    updateNotes(app.id, localNotes);
  };

  const setNoteField = (field: keyof ApplicationNotes, value: string) => {
    setLocalNotes(prev => ({ ...prev, [field]: value }));
  };

  // Textarea style shared across all note fields
  const textareaClass =
    "w-full rounded-md p-3 text-sm text-[#FAFAFA] bg-[#0A0A0A] border border-[#262626] placeholder:text-[#52525B] resize-none focus:outline-none focus:border-[#A78BFA] transition-colors duration-150";

  const NOTE_FIELDS: {
    key: keyof ApplicationNotes;
    label: string;
    placeholder: string;
    rows: number;
  }[] = [
    { key: "recruiterName",      label: "Recruiter name",      placeholder: "e.g., Sarah Chen",                                                                rows: 2 },
    { key: "interviewDate",      label: "Interview date",      placeholder: "e.g., Nov 14, 2pm PT",                                                            rows: 2 },
    { key: "hiringManager",      label: "Hiring manager",      placeholder: "e.g., Alex Kim, Director of Product",                                              rows: 2 },
    { key: "keyThemes",          label: "Key themes from JD",  placeholder: "What is this role really about? Growth? Platform? 0→1?",                           rows: 4 },
    { key: "questionsToAsk",     label: "Questions to ask",    placeholder: "What does success look like in 90 days? Biggest challenge facing the team?",       rows: 4 },
    { key: "postInterviewNotes", label: "Post-interview notes",placeholder: "What went well, what to follow up on, vibe check",                                 rows: 4 },
  ];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gradient-to-b from-white/[0.04] to-white/[0.02] border border-white/[0.08] hover:border-violet-500/30 rounded-lg p-4 shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-0.5 mb-3 flex flex-col ${CARD_LEFT_BORDER[app.status]} ${isDragging ? 'scale-105 rotate-2' : ''}`}
      onClick={(e) => {
        // Prevent expanding if clicking on a button or textarea
        if ((e.target as HTMLElement).closest('button, a, textarea')) return;
        toggleExpand(app.id);
      }}
      {...attributes}
      {...listeners}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 overflow-hidden pr-2">
          <h4 className="font-semibold text-[15px] text-white leading-tight mb-2 truncate" title={app.role}>{app.role}</h4>
          <p className="text-sm font-medium text-zinc-300 truncate">{app.company}</p>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{app.location}</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/[0.06]">
        <span className="text-xs text-zinc-500">{dateFormatted}</span>
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); window.location.href = `/parse?jdId=${app.parsedJDId}`; }} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors duration-150">
            <ExternalLink className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); deleteApp(app.id); }} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-4 cursor-default" onClick={e => e.stopPropagation()}>

          {/* ── Structured Notes ── */}
          <div className="border-t border-[#262626] pt-4 mt-4">
            <p className="text-sm font-semibold text-zinc-200 mb-3">Notes</p>
            {NOTE_FIELDS.map((field) => (
              <div key={field.key} className="mb-3">
                <label className="block text-xs font-medium text-zinc-400 mb-1">{field.label}</label>
                <textarea
                  value={localNotes[field.key]}
                  onChange={(e) => setNoteField(field.key, e.target.value)}
                  onBlur={handleFieldBlur}
                  onPointerDown={(e) => e.stopPropagation()}
                  placeholder={field.placeholder}
                  rows={field.rows}
                  className={textareaClass}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Artifacts</label>
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-muted/30 p-3 rounded-md border border-border/50 flex justify-between items-center">
                <div className="overflow-hidden pr-2">
                  <p className="text-sm font-medium">JD Summary</p>
                  <p className="text-xs text-muted-foreground truncate">{linkedData.jd?.summary || "Not available"}</p>
                </div>
              </div>
              
              <div className="bg-muted/30 p-3 rounded-md border border-border/50 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Resume Match</p>
                  {linkedData.resume ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] py-0">{linkedData.resume.gapAnalysis.matchLabel}</Badge>
                      <span className="text-xs text-muted-foreground">{linkedData.resume.gapAnalysis.missingKeywords.length} missing kw</span>
                    </div>
                  ) : <p className="text-xs text-muted-foreground">Not analyzed yet</p>}
                </div>
              </div>

              <div className="bg-muted/30 p-3 rounded-md border border-border/50 flex justify-between items-center">
                <div className="overflow-hidden pr-2">
                  <p className="text-sm font-medium">Outreach</p>
                  {linkedData.outreach ? (
                    <p className="text-xs text-muted-foreground truncate">{linkedData.outreach.connectionNote.substring(0, 80)}...</p>
                  ) : <p className="text-xs text-muted-foreground">Not generated yet</p>}
                </div>
              </div>

              <div className="bg-muted/30 p-3 rounded-md border border-border/50 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Prep Plan</p>
                  {linkedData.plan ? (
                    <p className="text-xs text-muted-foreground">
                      {linkedData.plan.days.reduce((acc, d) => acc + d.completedTaskIndices.length, 0)} / {linkedData.plan.days.reduce((acc, d) => acc + d.tasks.length, 0)} tasks done
                    </p>
                  ) : <p className="text-xs text-muted-foreground">Not generated yet</p>}
                </div>
              </div>
            </div>
            <div className="text-right pt-1">
              <a href={`/parse?resume=${app.parsedJDId}`} className="text-xs text-violet-500 hover:text-violet-400">View full →</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ status, columnApps, children }: { status: ApplicationStatus, columnApps: ApplicationCard[], children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 transition-colors duration-200 ${isOver ? "bg-violet-500/[0.03] border-violet-500/20 rounded-lg" : ""}`}
    >
      <SortableContext 
        items={columnApps.map(a => a.id)} 
        strategy={verticalListSortingStrategy}
      >
        <div className="h-full w-full flex flex-col gap-3">
          {children}
        </div>
      </SortableContext>
    </div>
  );
}

export default function TrackerPage() {
  const [apps, setApps] = useState<ApplicationCard[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeApp, setActiveApp] = useState<ApplicationCard | null>(null);
  const [mounted, setMounted] = useState(false);
  const [exportFeedback, setExportFeedback] = useState(false);

  // Cached linked data for performance
  const [linkedDataCache, setLinkedDataCache] = useState<Record<string, { jd: ParsedJD | null, resume: ResumeAnalysis | null, outreach: ColdOutreach | null, plan: PrepPlan | null }>>({});

  useEffect(() => {
    const fetchApps = async () => {
      const fetchedApps = await storage.getApplications();
      setApps(fetchedApps);
      setMounted(true);
    };
    fetchApps();
  }, []);



  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    
    setExpandedId(id);
    
    const app = apps.find(a => a.id === id);
    if (!app) return;
    
    const jdId = app.parsedJDId;
    if (!linkedDataCache[jdId]) {
      const [jd, resume, outreach, plan] = await Promise.all([
        storage.getParsedJDById(jdId),
        storage.getResumeAnalysisByJDId(jdId),
        storage.getOutreachByJDId(jdId),
        storage.getPrepPlanByJDId(jdId)
      ]);
      
      setLinkedDataCache(prev => ({ 
        ...prev, 
        [jdId]: { jd, resume, outreach, plan } 
      }));
    }
  };

  const deleteApp = async (id: string) => {
    if (window.confirm("Delete this application? This action cannot be undone.")) {
      await storage.deleteApplication(id);
      setApps(await storage.getApplications());
      toast.success("Application deleted");
    }
  };

  const updateNotes = async (id: string, notes: ApplicationNotes) => {
    await storage.updateApplicationNotes(id, notes);
    setApps(apps.map(a => a.id === id ? { ...a, notes } : a));
  };

  const exportData = async () => {
    const data = {
      exportedAt: new Date().toISOString(),
      applications: await storage.getApplications(),
      parsedJDs: await storage.getParsedJDs(),
      resumeAnalyses: await storage.getResumeAnalyses(),
      outreaches: await storage.getOutreaches(),
      prepPlans: await storage.getPrepPlans(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pm-copilot-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setExportFeedback(true);
    toast.success("Data exported successfully");
    setTimeout(() => setExportFeedback(false), 2000);
  };

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeApp = apps.find(a => a.id === active.id);
    if (activeApp) setActiveApp(activeApp);
    setExpandedId(null); // Collapse while dragging
  };

  const onDragOver = () => {
    // Left empty as we rely on dragEnd to persist between columns in this architecture
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveApp(null);
    const { active, over } = event;
    if (!over) return;

    const cardId = active.id as string;
    
    let newStatus: ApplicationStatus | null = null;

    if (COLUMNS.includes(over.id as ApplicationStatus)) {
      // Dropped directly on a column
      newStatus = over.id as ApplicationStatus;
    } else {
      // Dropped on another card — find which column that card belongs to
      const targetCard = apps.find(a => a.id === over.id);
      if (targetCard) newStatus = targetCard.status;
    }

    if (!newStatus) return;

    const card = apps.find(a => a.id === cardId);
    if (!card || card.status === newStatus) return;

    // Update state + localStorage
    const updated = apps.map(a =>
      a.id === cardId ? { ...a, status: newStatus!, updatedAt: new Date().toISOString() } : a
    );
    setApps(updated);
    await storage.updateApplicationStatus(cardId, newStatus);
    toast.success(`Moved to ${newStatus}`);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] bg-[radial-gradient(ellipse_at_top,_rgba(167,139,250,0.08),transparent_50%)] text-foreground flex flex-col">
      <div className="flex-1 px-4 md:px-8 max-w-[1600px] mx-auto w-full flex flex-col pt-12 pb-4">
        
        <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-4 border-b border-white/[0.06] pb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white mb-1">Application Tracker</h1>
            <p className="text-sm text-zinc-500">Drag cards between columns to update your status.</p>
          </div>
          <button 
            onClick={exportData} 
            className="flex items-center bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-zinc-300 hover:text-white px-4 py-2 rounded-lg transition-all duration-200 group"
          >
            {exportFeedback ? (
              <><Check className="w-4 h-4 mr-2 text-green-500" /> Exported!</>
            ) : (
              <><Download className="w-4 h-4 mr-2 text-zinc-500 group-hover:text-violet-400 transition-colors duration-200" /> Export Backup</>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="flex xl:grid xl:grid-cols-5 gap-4 h-full min-h-[500px]">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
            >
              {COLUMNS.map(status => {
                const columnApps = apps.filter(a => a.status === status);
                
                return (
                  <div key={status} className={`min-w-[280px] xl:min-w-0 w-full flex-shrink-0 flex flex-col bg-white/[0.02] rounded-xl border border-white/[0.06] p-4 min-h-[500px] ${COLUMN_TOP_BORDER_COLORS[status]}`}>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${COLUMN_COLORS[status]}`} />
                        <h3 className="text-sm font-medium text-zinc-200 tracking-wide">{status}</h3>
                      </div>
                      <div className="bg-white/[0.05] px-2 py-0.5 rounded-md text-xs text-zinc-400">{columnApps.length}</div>
                    </div>

                    <KanbanColumn status={status} columnApps={columnApps}>
                      {columnApps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/[0.06] rounded-lg mx-2 transition-colors duration-200">
                          {COLUMN_EMPTY_ICONS[status]}
                          <p className="text-sm font-medium text-zinc-500 mb-1">
                            {status === "Saved" ? "No saved jobs yet" : "No applications here"}
                          </p>
                          <p className="text-xs text-zinc-600">
                            {status === "Saved" ? "Parse a JD and click 'Save to Tracker'" : "Drag a card here to update status"}
                          </p>
                          {status === "Saved" && (
                            <Button variant="link" className="mt-2 text-violet-500 h-auto p-0 text-xs" onClick={() => window.location.href='/parse'}>
                              Parse a JD →
                            </Button>
                          )}
                        </div>
                      ) : (
                        columnApps.map(app => (
                          <SortableCard 
                            key={app.id} 
                            app={app} 
                            expandedId={expandedId}
                            toggleExpand={toggleExpand}
                            deleteApp={deleteApp}
                            updateNotes={updateNotes}
                            linkedData={linkedDataCache[app.parsedJDId] || {}}
                          />
                        ))
                      )}
                    </KanbanColumn>
                  </div>
                );
              })}
              
              <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } })
              }}>
                {activeApp ? (
                  <div className={`bg-gradient-to-b from-white/[0.04] to-white/[0.02] border border-violet-500/30 rounded-lg p-4 shadow-xl opacity-90 scale-105 rotate-2 ${COLUMN_TOP_BORDER_COLORS[activeApp.status]}`}>
                    <h4 className="font-semibold text-[15px] text-white leading-tight mb-2 truncate">{activeApp.role}</h4>
                    <p className="text-sm font-medium text-zinc-300 truncate">{activeApp.company}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{activeApp.location}</p>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
        
      </div>
    </div>
  );
}
