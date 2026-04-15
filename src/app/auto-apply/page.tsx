"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { loadProfile, saveProfile, buildResumeText } from "@/lib/profile-store";
import type { AutoApplySettings } from "@/lib/profile-store";
import { cn, scoreColor, STATUS_COLORS, formatSalary } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Zap, Play, CheckCircle, XCircle, Eye, FileText,
  Send, Clock, AlertCircle, Plus, Trash2, Save,
  ChevronDown, ChevronUp, RefreshCw, Building2,
  MapPin, Star,
} from "lucide-react";
import { toast } from "sonner";

type ApplyStep = "process" | "summarize" | "pdf" | "apply";
type StepStatus = "pending" | "running" | "done" | "error";

interface JobApplyState {
  jobId: string;
  title: string;
  employer: string;
  score?: number;
  status: "queued" | "running" | "done" | "error" | "skipped" | "review";
  steps: Record<ApplyStep, StepStatus>;
  coverLetter?: string;
  errorMsg?: string;
  pdfPath?: string;
}

const STEPS: ApplyStep[] = ["process", "summarize", "pdf", "apply"];
const STEP_LABELS: Record<ApplyStep, string> = {
  process: "Analyse",
  summarize: "Tailor",
  pdf: "Generate PDF",
  apply: "Submit",
};

export default function AutoApplyPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<AutoApplySettings | null>(null);
  const [dirtySettings, setDirtySettings] = useState(false);
  const [queue, setQueue] = useState<JobApplyState[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Load settings from profile
  useEffect(() => {
    setSettings(loadProfile().autoApply);
  }, []);

  // Fetch ready jobs
  const { data: readyJobs, refetch } = useQuery({
    queryKey: ["jobs", "ready"],
    queryFn: () => api.jobs.list(["ready"]),
    refetchInterval: 45_000,
    staleTime: 30_000,
  });

  const updateSettings = (patch: Partial<AutoApplySettings>) => {
    setSettings((prev) => prev ? { ...prev, ...patch } : prev);
    setDirtySettings(true);
  };

  const saveSettings = () => {
    if (!settings) return;
    const p = loadProfile();
    p.autoApply = settings;
    saveProfile(p);
    setDirtySettings(false);
    toast.success("Auto-apply settings saved");
  };

  // Build queue from ready jobs
  const buildQueue = () => {
    const jobs = (readyJobs?.jobs ?? [])
      .filter((j) => (j.suitabilityScore ?? 0) >= (settings?.autoSkipBelow ?? 0))
      .slice(0, settings?.maxDailyApplications ?? 10);

    setQueue(
      jobs.map((j) => ({
        jobId: j.id,
        title: j.title,
        employer: j.employer,
        score: j.suitabilityScore,
        status: "queued",
        steps: { process: "pending", summarize: "pending", pdf: "pending", apply: "pending" },
      }))
    );
    toast.success(`${jobs.length} jobs queued`);
  };

  const updateJob = (id: string, patch: Partial<JobApplyState>) => {
    setQueue((prev) => prev.map((j) => (j.jobId === id ? { ...j, ...patch } : j)));
  };

  const setStep = (id: string, step: ApplyStep, status: StepStatus) => {
    setQueue((prev) =>
      prev.map((j) => (j.jobId === id ? { ...j, steps: { ...j.steps, [step]: status } } : j))
    );
  };

  const processJob = async (job: JobApplyState) => {
    updateJob(job.jobId, { status: "running" });

    try {
      // Step 1: process (discover → ready)
      setStep(job.jobId, "process", "running");
      await api.jobs.process(job.jobId, true);
      setStep(job.jobId, "process", "done");

      // Step 2: summarize / tailor
      setStep(job.jobId, "summarize", "running");
      await api.jobs.summarize(job.jobId);
      setStep(job.jobId, "summarize", "done");

      // Step 2b: generate cover letter if enabled — passes custom Q&A so the
      // LLM can weave pre-written answers into the letter
      if (settings?.coverLetterEnabled) {
        const profile = loadProfile();
        const profileText = buildResumeText(profile);
        try {
          const cl = await api.autoApply.generateCoverLetter(
            job.jobId,
            settings.coverLetterStyle,
            profileText,
            settings.customAnswers,   // ← injected here
          );
          updateJob(job.jobId, { coverLetter: cl?.reply ?? cl?.message ?? "" });
        } catch (e) {
          // non-fatal — cover letter failure doesn't block the rest
          if (process.env.NODE_ENV === "development") console.warn("[cover letter]", e);
          updateJob(job.jobId, { coverLetter: undefined });
        }
      }

      // Step 3: PDF
      setStep(job.jobId, "pdf", "running");
      const pdfResult = await api.autoApply.processJob(job.jobId);
      setStep(job.jobId, "pdf", "done");
      updateJob(job.jobId, { pdfPath: pdfResult?.data?.pdfPath ?? pdfResult?.pdfPath });

      // If review required, pause here so the user can read the cover letter
      // and check the PDF before we submit
      if (settings?.requireReview) {
        updateJob(job.jobId, { status: "review" });
        return;
      }

      // Step 4: apply
      setStep(job.jobId, "apply", "running");
      await api.autoApply.submitApplication(job.jobId);
      setStep(job.jobId, "apply", "done");
      updateJob(job.jobId, { status: "done" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      updateJob(job.jobId, { status: "error", errorMsg: msg });
      // mark current step as error
      const currentStep = STEPS.find((s) => job.steps[s] === "running" || job.steps[s] === "pending");
      if (currentStep) setStep(job.jobId, currentStep, "error");
    }
  };

  const approveAndApply = async (jobId: string) => {
    setStep(jobId, "apply", "running");
    try {
      await api.autoApply.submitApplication(jobId);
      setStep(jobId, "apply", "done");
      updateJob(jobId, { status: "done" });
      toast.success("Application submitted!");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Apply failed";
      setStep(jobId, "apply", "error");
      updateJob(jobId, { status: "error", errorMsg: msg });
      toast.error(msg);
    }
  };

  const runAll = async () => {
    if (queue.length === 0) { toast.error("Queue is empty"); return; }
    setIsRunning(true);
    for (const job of queue.filter((j) => j.status === "queued")) {
      await processJob(job);
    }
    setIsRunning(false);
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
    toast.success("Auto-apply run complete");
  };

  const done = queue.filter((j) => j.status === "done").length;
  const reviewing = queue.filter((j) => j.status === "review").length;
  const errors = queue.filter((j) => j.status === "error").length;
  const progress = queue.length > 0 ? Math.round((done / queue.length) * 100) : 0;

  if (!settings) return (
    <div className="p-6 space-y-4 max-w-4xl">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-40 bg-zinc-800/40 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Auto-Apply</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Automatically tailor, generate PDFs, and submit applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {dirtySettings && (
            <Button variant="outline" size="sm" onClick={saveSettings}>
              <Save className="h-3.5 w-3.5" /> Save settings
            </Button>
          )}
        </div>
      </div>

      {/* Profile completeness warning */}
      {(() => {
        const p = loadProfile();
        const missing = [];
        if (!p.personal.fullName) missing.push("name");
        if (!p.personal.email) missing.push("email");
        if (p.experience.length === 0) missing.push("work experience");
        if (p.skills.length === 0) missing.push("skills");
        if (missing.length === 0) return null;
        return (
          <div className="flex items-start gap-3 rounded-lg border border-yellow-700/30 bg-yellow-900/10 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-yellow-300">Profile incomplete</p>
              <p className="text-zinc-400 mt-0.5">
                Missing: {missing.join(", ")}. <a href="/profile" className="underline text-zinc-300">Complete your profile</a> for better AI tailoring.
              </p>
            </div>
          </div>
        );
      })()}

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-400" /> Automation Settings</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Enable auto-apply</span>
              <Switch checked={settings.enabled} onCheckedChange={(v) => updateSettings({ enabled: v })} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-4", !settings.enabled && "opacity-50 pointer-events-none")}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Skip jobs below score</label>
              <Input type="number" min={0} max={100} value={settings.autoSkipBelow}
                onChange={(e) => updateSettings({ autoSkipBelow: Number(e.target.value) })} />
              <p className="text-xs text-zinc-600 mt-1">Jobs below {settings.autoSkipBelow} are not auto-applied</p>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Max applications per run</label>
              <Input type="number" min={1} max={50} value={settings.maxDailyApplications}
                onChange={(e) => updateSettings({ maxDailyApplications: Number(e.target.value) })} />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-200">Require human review before submitting</p>
              <p className="text-xs text-zinc-500 mt-0.5">Pause after PDF generation so you can review each application</p>
            </div>
            <Switch checked={settings.requireReview} onCheckedChange={(v) => updateSettings({ requireReview: v })} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-200">Generate cover letter</p>
              <p className="text-xs text-zinc-500 mt-0.5">AI-written cover letter based on your profile and the job</p>
            </div>
            <Switch checked={settings.coverLetterEnabled} onCheckedChange={(v) => updateSettings({ coverLetterEnabled: v })} />
          </div>

          {settings.coverLetterEnabled && (
            <div className="pl-4 border-l border-zinc-800">
              <p className="text-xs text-zinc-400 mb-2">Cover letter style</p>
              <div className="flex gap-2">
                {(["formal", "casual", "concise"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateSettings({ coverLetterStyle: s })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs border capitalize transition-colors",
                      settings.coverLetterStyle === s
                        ? "border-zinc-500 bg-zinc-800 text-zinc-100 font-medium"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Custom Q&A */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-zinc-200">Custom application answers</p>
                <p className="text-xs text-zinc-500 mt-0.5">Pre-fill common application questions</p>
              </div>
              <Button variant="outline" size="sm"
                onClick={() => updateSettings({ customAnswers: [...settings.customAnswers, { question: "", answer: "" }] })}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {settings.customAnswers.length === 0 && (
                <p className="text-xs text-zinc-600 italic text-center py-3">No custom answers yet</p>
              )}
              {settings.customAnswers.map((qa, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1.5">
                    <Input
                      value={qa.question}
                      onChange={(e) => {
                        const updated = [...settings.customAnswers];
                        updated[i] = { ...updated[i], question: e.target.value };
                        updateSettings({ customAnswers: updated });
                      }}
                      placeholder="Question (e.g. Why do you want to work here?)"
                      className="text-xs h-8"
                    />
                    <Input
                      value={qa.answer}
                      onChange={(e) => {
                        const updated = [...settings.customAnswers];
                        updated[i] = { ...updated[i], answer: e.target.value };
                        updateSettings({ customAnswers: updated });
                      }}
                      placeholder="Your answer…"
                      className="text-xs h-8"
                    />
                  </div>
                  <button
                    onClick={() => updateSettings({ customAnswers: settings.customAnswers.filter((_, j) => j !== i) })}
                    className="p-1.5 text-zinc-600 hover:text-red-400 mt-0.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue builder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Play className="h-4 w-4" /> Application Queue
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">
                {readyJobs?.total ?? 0} ready · {queue.length} queued
              </span>
              <Button variant="outline" size="sm" onClick={buildQueue}>
                Build queue
              </Button>
              <Button
                size="sm"
                onClick={runAll}
                disabled={isRunning || queue.length === 0}
                className="gap-1.5"
              >
                {isRunning ? (
                  <><span className="h-3.5 w-3.5 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" /> Running…</>
                ) : (
                  <><Zap className="h-3.5 w-3.5" /> Apply All</>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Progress */}
          {queue.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>{done}/{queue.length} complete · {reviewing} awaiting review · {errors} errors</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} indicatorClassName="bg-emerald-500" />
            </div>
          )}

          {queue.length === 0 ? (
            <div className="py-10 text-center">
              <Play className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-400">Queue is empty</p>
              <p className="text-xs text-zinc-600 mt-1">
                Click "Build queue" to load ready jobs above your score threshold ({settings.autoSkipBelow}+)
              </p>
              {(readyJobs?.total ?? 0) === 0 && (
                <p className="text-xs text-yellow-500/80 mt-2">
                  No ready jobs found. Run the pipeline or move jobs to Ready status first.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((job) => (
                <QueueJobRow
                  key={job.jobId}
                  job={job}
                  expanded={expanded === job.jobId}
                  onToggle={() => setExpanded(expanded === job.jobId ? null : job.jobId)}
                  onApprove={() => approveAndApply(job.jobId)}
                  onSkip={() => updateJob(job.jobId, { status: "skipped" })}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function QueueJobRow({
  job, expanded, onToggle, onApprove, onSkip,
}: {
  job: JobApplyState;
  expanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onSkip: () => void;
}) {
  const STATUS_ICON = {
    queued: <Clock className="h-4 w-4 text-zinc-500" />,
    running: <span className="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />,
    review: <Eye className="h-4 w-4 text-yellow-400" />,
    done: <CheckCircle className="h-4 w-4 text-emerald-400" />,
    error: <XCircle className="h-4 w-4 text-red-400" />,
    skipped: <XCircle className="h-4 w-4 text-zinc-600" />,
  };

  const STEP_COLOR: Record<StepStatus, string> = {
    pending: "bg-zinc-700",
    running: "bg-blue-400 animate-pulse",
    done: "bg-emerald-400",
    error: "bg-red-400",
  };

  return (
    <div className={cn(
      "rounded-lg border overflow-hidden transition-colors",
      job.status === "review" && "border-yellow-700/50 bg-yellow-950/10",
      job.status === "done" && "border-emerald-800/40 bg-emerald-950/10",
      job.status === "error" && "border-red-800/40 bg-red-950/10",
      job.status === "skipped" && "border-zinc-800 opacity-50",
      !["review","done","error","skipped"].includes(job.status) && "border-zinc-800",
    )}>
      <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/20 transition-colors" onClick={onToggle}>
        {STATUS_ICON[job.status]}
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-zinc-200 truncate">{job.title}</p>
          <p className="text-xs text-zinc-500">{job.employer}</p>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5 shrink-0">
          {STEPS.map((step) => (
            <div key={step} className="flex flex-col items-center gap-0.5">
              <div className={cn("h-1.5 w-5 rounded-full transition-colors", STEP_COLOR[job.steps[step]])} />
              <span className={cn(
                "text-[9px]",
                job.steps[step] === "running" ? "text-blue-400 font-medium" : "text-zinc-600"
              )}>{STEP_LABELS[step]}</span>
            </div>
          ))}
        </div>

        {/* Active step label */}
        {job.status === "running" && (() => {
          const active = STEPS.find((s) => job.steps[s] === "running");
          return active ? (
            <span className="text-[10px] text-blue-400 animate-pulse shrink-0 hidden sm:block">
              {STEP_LABELS[active]}…
            </span>
          ) : null;
        })()}

        {job.score != null && (
          <span className={cn("text-xs font-bold tabular-nums w-8 text-right", scoreColor(job.score))}>
            {job.score}
          </span>
        )}

        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-zinc-500" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-zinc-800 pt-3 space-y-3">
          {/* Error */}
          {job.errorMsg && (
            <div className="flex items-start gap-2 text-xs text-red-300 bg-red-900/10 rounded px-3 py-2">
              <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {job.errorMsg}
            </div>
          )}

          {/* Cover letter preview */}
          {job.coverLetter && (
            <div>
              <p className="text-xs text-zinc-400 mb-1.5 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> Cover letter
              </p>
              <div className="bg-zinc-950 rounded p-3 text-xs text-zinc-300 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                {job.coverLetter}
              </div>
            </div>
          )}

          {/* Review actions */}
          {job.status === "review" && (
            <div className="flex items-center gap-2">
              <div className="flex-1 text-xs text-yellow-400 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> PDF generated — review before submitting
              </div>
              <Button size="sm" variant="ghost" onClick={onSkip}>Skip</Button>
              <Button size="sm" onClick={onApprove}>
                <Send className="h-3.5 w-3.5" /> Submit Application
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
