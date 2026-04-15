"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "@/lib/api";
import { cn, scoreColor, STATUS_COLORS, STATUS_LABELS, timeAgo } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  Briefcase, TrendingUp, Send, CheckCircle, Play,
  RefreshCw, ChevronRight, Activity,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip as ReTooltip, ResponsiveContainer, Cell,
} from "recharts";
import { format, subDays } from "date-fns";
import { toast } from "sonner";

const SCORE_BARS = [
  { range: "90-100", min: 90, max: 100, color: "#10b981" },
  { range: "80-89", min: 80, max: 90, color: "#34d399" },
  { range: "70-79", min: 70, max: 80, color: "#fbbf24" },
  { range: "60-69", min: 60, max: 70, color: "#f97316" },
  { range: "<60", min: 0, max: 60, color: "#f43f5e" },
];

export default function DashboardPage() {
  // Polling: dashboard stat cards update every 60s (not 30s) to reduce server load.
  // Pipeline status stays at 10s since users watch it actively.
  const { data: jobsData, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ["jobs-all"],
    queryFn: () => api.jobs.list(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const { data: pipelineStatus, refetch: refetchPipeline } = useQuery({
    queryKey: ["pipeline-status"],
    queryFn: () => api.pipeline.status(),
    // Poll fast while running, slow otherwise
    refetchInterval: (query) => (query.state.data?.isRunning ? 8_000 : 30_000),
  });

  const { data: pipelineRuns } = useQuery({
    queryKey: ["pipeline-runs"],
    queryFn: () => api.pipeline.runs(),
    refetchInterval: 60_000,
    staleTime: 45_000,
  });

  const handleRunPipeline = async () => {
    try {
      await api.pipeline.run({ topN: 20, minSuitabilityScore: 60 });
      toast.success("Pipeline started!");
      refetchPipeline();
    } catch {
      toast.error("Failed to start pipeline");
    }
  };

  const jobs = jobsData?.jobs ?? [];
  const byStatus = jobsData?.byStatus ?? {};

  // Memoised so these don't recalculate on every render (only when jobs changes)
  const activityData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const label = format(day, "MMM d");
    const dayStart = new Date(day).setHours(0, 0, 0, 0);
    const dayEnd = dayStart + 86400000;
    const discovered = jobs.filter((j) => j.createdAt >= dayStart && j.createdAt < dayEnd).length;
    const applied = jobs.filter(
      (j) => j.status === "applied" && j.updatedAt >= dayStart && j.updatedAt < dayEnd
    ).length;
    return { label, discovered, applied };
  }), [jobs]);

  const scoreDist = useMemo(() => SCORE_BARS.map((b) => ({
    ...b,
    count: jobs.filter((j) => (j.suitabilityScore ?? 0) >= b.min && (j.suitabilityScore ?? 0) < b.max).length,
  })), [jobs]);

  const statCards = useMemo(() => [
    { label: "Discovered", value: byStatus.discovered ?? 0, icon: Briefcase, color: "text-blue-400", bg: "bg-blue-900/20", href: "/jobs?status=discovered" },
    { label: "Ready", value: byStatus.ready ?? 0, icon: CheckCircle, color: "text-purple-400", bg: "bg-purple-900/20", href: "/jobs?status=ready" },
    { label: "Applied", value: byStatus.applied ?? 0, icon: Send, color: "text-emerald-400", bg: "bg-emerald-900/20", href: "/jobs?status=applied" },
    { label: "In Progress", value: byStatus.in_progress ?? 0, icon: TrendingUp, color: "text-orange-400", bg: "bg-orange-900/20", href: "/jobs?status=in_progress" },
  ], [byStatus]);

  const avgScore = useMemo(() =>
    jobs.length > 0
      ? Math.round(jobs.reduce((s, j) => s + (j.suitabilityScore ?? 0), 0) / jobs.length)
      : 0,
    [jobs]);

  const recentJobs = useMemo(
    () => [...jobs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
    [jobs],
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Job application automation overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => { refetchJobs(); refetchPipeline(); }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleRunPipeline} disabled={pipelineStatus?.isRunning} size="sm" className="gap-1.5">
            {pipelineStatus?.isRunning ? (
              <><Activity className="h-3.5 w-3.5 animate-pulse" /> Running…</>
            ) : (
              <><Play className="h-3.5 w-3.5" /> Run Pipeline</>
            )}
          </Button>
        </div>
      </div>

      {pipelineStatus?.isRunning && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-700/40 bg-blue-900/20 px-4 py-3">
          <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-sm text-blue-300">Pipeline is running — discovering and scoring jobs…</span>
          <Button
            variant="ghost" size="sm"
            className="ml-auto text-blue-400 hover:text-blue-200"
            onClick={() => api.pipeline.cancel().then(() => refetchPipeline())}
          >
            Cancel
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:border-zinc-700 transition-colors cursor-pointer">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">{label}</p>
                    <p className="text-3xl font-bold text-white">{jobsLoading ? "—" : value}</p>
                  </div>
                  <div className={cn("rounded-lg p-2", bg)}>
                    <Icon className={cn("h-5 w-5", color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ErrorBoundary section="Activity chart">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>7-day activity</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={activityData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="gDisc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gApp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <ReTooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#a1a1aa" }} />
                  <Area type="monotone" dataKey="discovered" stroke="#3b82f6" fill="url(#gDisc)" strokeWidth={2} name="Discovered" />
                  <Area type="monotone" dataKey="applied" stroke="#10b981" fill="url(#gApp)" strokeWidth={2} name="Applied" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400"><span className="h-2 w-2 rounded-full bg-blue-500" />Discovered</div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400"><span className="h-2 w-2 rounded-full bg-emerald-500" />Applied</div>
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        <ErrorBoundary section="Score chart">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Score distribution</CardTitle>
                <span className={cn("text-2xl font-bold", scoreColor(avgScore))}>{avgScore}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={scoreDist} margin={{ top: 4, right: 4, bottom: 0, left: -30 }}>
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <ReTooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]} name="Jobs">
                    {scoreDist.map((b, i) => <Cell key={i} fill={b.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-zinc-500 mt-1">Avg suitability across all jobs</p>
            </CardContent>
          </Card>
        </ErrorBoundary>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent jobs</CardTitle>
              <Link href="/jobs" className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-0.5">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentJobs.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-6">No jobs yet. Run the pipeline to discover jobs.</p>
            )}
            {recentJobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <div className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-zinc-800/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">{job.title}</p>
                    <p className="text-xs text-zinc-400 truncate">{job.employer} · {job.source}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {job.suitabilityScore != null && (
                      <span className={cn("text-xs font-bold tabular-nums", scoreColor(job.suitabilityScore))}>
                        {job.suitabilityScore}
                      </span>
                    )}
                    <span className={cn("px-2 py-0.5 rounded-full text-xs", STATUS_COLORS[job.status])}>
                      {STATUS_LABELS[job.status]}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent pipeline runs</CardTitle>
              <Link href="/pipeline" className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-0.5">
                Control <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {(!pipelineRuns || pipelineRuns.length === 0) && (
              <p className="text-sm text-zinc-500 text-center py-6">No runs yet.</p>
            )}
            {(pipelineRuns ?? []).slice(0, 5).map((run) => (
              <div key={run.id} className="flex items-center gap-3 rounded-lg p-2.5">
                <div className={cn("h-2 w-2 rounded-full shrink-0", {
                  "bg-emerald-400": run.status === "completed",
                  "bg-blue-400 animate-pulse": run.status === "running",
                  "bg-red-400": run.status === "failed",
                  "bg-zinc-500": run.status === "cancelled",
                })} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 font-medium capitalize">{run.status}</p>
                  <p className="text-xs text-zinc-500">{timeAgo(run.startedAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-zinc-200">{run.jobsFound} jobs</p>
                  {run.completedAt && (
                    <p className="text-xs text-zinc-500">{Math.round((run.completedAt - run.startedAt) / 1000)}s</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Pipeline funnel</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(STATUS_LABELS).map(([status, label]) => {
              const count = byStatus[status] ?? 0;
              const total = Math.max(jobsData?.total ?? 1, 1);
              const pct = Math.round((count / total) * 100);
              return (
                <Link key={status} href={`/jobs?status=${status}`}>
                  <div className="rounded-lg p-3 border border-zinc-800 hover:border-zinc-700 transition-colors">
                    <p className="text-xs text-zinc-500 mb-1">{label}</p>
                    <p className="text-xl font-bold text-white mb-2">{count}</p>
                    <Progress value={pct} className="h-1" indicatorClassName={cn({
                      "bg-blue-500": status === "discovered",
                      "bg-purple-500": status === "ready",
                      "bg-emerald-500": status === "applied",
                      "bg-orange-500": status === "in_progress",
                      "bg-zinc-600": status === "skipped",
                      "bg-zinc-700": status === "closed",
                    })} />
                    <p className="text-xs text-zinc-600 mt-1">{pct}%</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
