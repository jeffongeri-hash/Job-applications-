"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, PipelineRun } from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Play, Square, RefreshCw, Activity, CheckCircle, XCircle,
  Clock, Zap, Settings2, ChevronDown, ChevronUp, Info,
} from "lucide-react";
import { toast } from "sonner";

// All known job board sources
const ALL_SOURCES = [
  { id: "linkedin", label: "LinkedIn", description: "Professional network jobs" },
  { id: "indeed", label: "Indeed", description: "General job board" },
  { id: "glassdoor", label: "Glassdoor", description: "Company reviews + jobs" },
  { id: "adzuna", label: "Adzuna", description: "Multi-country aggregator (API key needed)" },
  { id: "hiring_cafe", label: "HiringCafe", description: "Tech startup jobs" },
  { id: "startup_jobs", label: "startup.jobs", description: "Startup-focused listings" },
  { id: "working_nomads", label: "WorkingNomads", description: "Remote-friendly roles" },
  { id: "gradcracker", label: "GradCracker", description: "Graduate engineering roles (UK)" },
  { id: "uk_visa_jobs", label: "UK Visa Jobs", description: "UK sponsored visa roles" },
];

interface PipelineProgress {
  stage?: string;
  message?: string;
  percent?: number;
  jobsFound?: number;
}

export default function PipelinePage() {
  const queryClient = useQueryClient();
  const [selectedSources, setSelectedSources] = useState<Set<string>>(
    new Set(ALL_SOURCES.map((s) => s.id))
  );
  const [topN, setTopN] = useState(20);
  const [minScore, setMinScore] = useState(60);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [liveLog, setLiveLog] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  const { data: pipelineStatus, refetch: refetchStatus } = useQuery({
    queryKey: ["pipeline-status"],
    queryFn: () => api.pipeline.status(),
    refetchInterval: 5_000,
  });

  const { data: runs } = useQuery({
    queryKey: ["pipeline-runs"],
    queryFn: () => api.pipeline.runs(),
    refetchInterval: 10_000,
  });

  // Live SSE progress
  useEffect(() => {
    if (!pipelineStatus?.isRunning) return;

    const url = api.pipeline.progressUrl();
    const es = new EventSource(url);
    sseRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.stage || data.message) {
          setProgress(data);
          const msg = `[${data.stage ?? "info"}] ${data.message ?? ""}`;
          setLiveLog((prev) => [...prev.slice(-99), msg]);
          if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
        }
      } catch {}
    };

    es.onerror = () => es.close();

    return () => {
      es.close();
      sseRef.current = null;
    };
  }, [pipelineStatus?.isRunning]);

  const runMutation = useMutation({
    mutationFn: () =>
      api.pipeline.run({
        topN,
        minSuitabilityScore: minScore,
        sources: [...selectedSources],
      }),
    onSuccess: () => {
      toast.success("Pipeline started!");
      setLiveLog([]);
      setProgress(null);
      refetchStatus();
      queryClient.invalidateQueries({ queryKey: ["pipeline-runs"] });
    },
    onError: () => toast.error("Failed to start pipeline"),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.pipeline.cancel(),
    onSuccess: () => {
      toast.info("Pipeline cancelled");
      refetchStatus();
    },
  });

  const toggleSource = (id: string) => {
    const next = new Set(selectedSources);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSources(next);
  };

  const isRunning = pipelineStatus?.isRunning ?? false;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Pipeline</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Automate job discovery, scoring, and tailoring</p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => refetchStatus()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Status card */}
      <Card className={cn(isRunning && "border-blue-700/50 bg-blue-950/20")}>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-3 w-3 rounded-full",
                isRunning ? "bg-blue-400 animate-pulse" : "bg-zinc-600"
              )} />
              <div>
                <p className="text-sm font-semibold text-white">
                  {isRunning ? "Pipeline Running" : "Pipeline Idle"}
                </p>
                {pipelineStatus?.lastRun && (
                  <p className="text-xs text-zinc-400">
                    Last run: {timeAgo(pipelineStatus.lastRun.startedAt)} · {pipelineStatus.lastRun.jobsFound} jobs found
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isRunning ? (
                <Button
                  variant="destructive" size="sm"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                >
                  <Square className="h-3.5 w-3.5" /> Cancel
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => runMutation.mutate()}
                  disabled={runMutation.isPending}
                  className="gap-1.5"
                >
                  <Play className="h-3.5 w-3.5" /> Run Pipeline
                </Button>
              )}
            </div>
          </div>

          {/* Live progress */}
          {isRunning && progress && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="capitalize">{progress.stage?.replace(/_/g, " ") ?? "Processing"}</span>
                {progress.percent != null && <span>{progress.percent}%</span>}
              </div>
              {progress.percent != null && (
                <Progress value={progress.percent} indicatorClassName="bg-blue-500" />
              )}
              {progress.message && (
                <p className="text-xs text-zinc-400">{progress.message}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live log */}
      {(isRunning || liveLog.length > 0) && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-blue-400" /> Live Log</CardTitle></CardHeader>
          <CardContent>
            <div
              ref={logRef}
              className="bg-zinc-950 rounded-lg p-3 h-48 overflow-y-auto font-mono text-xs text-zinc-300 space-y-0.5"
            >
              {liveLog.length === 0 ? (
                <p className="text-zinc-600">Waiting for output…</p>
              ) : (
                liveLog.map((line, i) => <p key={i}>{line}</p>)
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Config */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" /> Run Configuration
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Basic params */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Top N jobs per source</label>
              <Input
                type="number" min={1} max={50} value={topN}
                onChange={(e) => setTopN(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-zinc-600 mt-1">Max jobs to process per source (1–50)</p>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Min suitability score</label>
              <Input
                type="number" min={0} max={100} value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-zinc-600 mt-1">Skip jobs below this score (0–100)</p>
            </div>
          </div>

          {/* Sources */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-zinc-400">Job board sources</label>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setSelectedSources(new Set(ALL_SOURCES.map((s) => s.id)))}>
                  All
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedSources(new Set())}>
                  None
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {ALL_SOURCES.map((source) => {
                const active = selectedSources.has(source.id);
                return (
                  <button
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                      active
                        ? "border-zinc-600 bg-zinc-800/60"
                        : "border-zinc-800 bg-zinc-900/40 opacity-60 hover:opacity-80"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 h-4 w-4 rounded border shrink-0 flex items-center justify-center",
                      active ? "bg-zinc-200 border-zinc-200" : "border-zinc-600"
                    )}>
                      {active && <CheckCircle className="h-3 w-3 text-zinc-900" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-200">{source.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{source.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={() => runMutation.mutate()}
            disabled={isRunning || runMutation.isPending || selectedSources.size === 0}
            className="w-full"
          >
            <Play className="h-4 w-4" />
            {isRunning ? "Pipeline is running…" : `Run with ${selectedSources.size} source${selectedSources.size !== 1 ? "s" : ""}`}
          </Button>
        </CardContent>
      </Card>

      {/* Automation scheduler */}
      <AutomationScheduler />

      {/* Run history */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Run History</CardTitle></CardHeader>
        <CardContent>
          {(!runs || runs.length === 0) ? (
            <p className="text-sm text-zinc-500 text-center py-4">No runs yet.</p>
          ) : (
            <div className="space-y-1">
              {runs.map((run) => (
                <RunRow key={run.id} run={run} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RunRow({ run }: { run: PipelineRun }) {
  const [open, setOpen] = useState(false);
  const duration = run.completedAt
    ? Math.round((run.completedAt - run.startedAt) / 1000)
    : null;

  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-zinc-800/40 transition-colors"
      >
        <div className={cn("h-2 w-2 rounded-full shrink-0", {
          "bg-emerald-400": run.status === "completed",
          "bg-blue-400 animate-pulse": run.status === "running",
          "bg-red-400": run.status === "failed",
          "bg-zinc-500": run.status === "cancelled",
        })} />
        <div className="flex-1 text-left">
          <span className="text-xs text-zinc-300 font-medium capitalize">{run.status}</span>
          <span className="text-xs text-zinc-500 ml-2">{timeAgo(run.startedAt)}</span>
        </div>
        <div className="flex items-center gap-3 text-right">
          <span className="text-xs text-zinc-400">{run.jobsFound} jobs</span>
          {duration != null && <span className="text-xs text-zinc-600">{duration}s</span>}
          {open ? <ChevronUp className="h-3 w-3 text-zinc-500" /> : <ChevronDown className="h-3 w-3 text-zinc-500" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 text-xs text-zinc-500 border-t border-zinc-800 pt-2 space-y-1">
          <p>Run ID: <span className="font-mono text-zinc-400">{run.id}</span></p>
          {run.sources && <p>Sources: {run.sources.join(", ")}</p>}
          {run.error && <p className="text-red-400">Error: {run.error}</p>}
        </div>
      )}
    </div>
  );
}

function AutomationScheduler() {
  const [enabled, setEnabled] = useState(false);
  const [schedule, setSchedule] = useState("0 8 * * *");
  const [saved, setSaved] = useState(false);

  // In a real integration this would PATCH /api/settings with a cron schedule.
  // For now it stores in localStorage as a UI demo.
  useEffect(() => {
    const stored = localStorage.getItem("jobops_schedule");
    if (stored) {
      const { enabled: e, cron } = JSON.parse(stored);
      setEnabled(e);
      setSchedule(cron);
    }
  }, []);

  const save = () => {
    localStorage.setItem("jobops_schedule", JSON.stringify({ enabled, cron: schedule }));
    setSaved(true);
    toast.success(enabled ? `Schedule saved: ${schedule}` : "Schedule disabled");
    setTimeout(() => setSaved(false), 2000);
  };

  const PRESETS = [
    { label: "Daily 8am", cron: "0 8 * * *" },
    { label: "Twice daily", cron: "0 8,18 * * *" },
    { label: "Weekdays 9am", cron: "0 9 * * 1-5" },
    { label: "Every 6h", cron: "0 */6 * * *" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-400" /> Automation Schedule
          </CardTitle>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-4", !enabled && "opacity-50 pointer-events-none")}>
        <p className="text-xs text-zinc-400">
          Schedule automatic pipeline runs using cron syntax. The job-ops server must be running with cron support.
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.cron}
              onClick={() => setSchedule(p.cron)}
              className={cn(
                "px-3 py-1 rounded-full text-xs border transition-colors",
                schedule === p.cron
                  ? "border-zinc-400 bg-zinc-700 text-zinc-200"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1.5 block">Cron expression</label>
          <div className="flex gap-2">
            <Input
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="0 8 * * *"
              className="font-mono"
            />
            <Button variant="outline" size="sm" onClick={save}>
              {saved ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : "Save"}
            </Button>
          </div>
          <p className="text-xs text-zinc-600 mt-1.5 flex items-center gap-1">
            <Info className="h-3 w-3" />
            Configure cron in your Docker compose or systemd to call POST /api/pipeline/run
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
