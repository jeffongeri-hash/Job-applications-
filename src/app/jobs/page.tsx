"use client";

import { useState, useMemo, Suspense, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { api, JobStatus, JobListItem } from "@/lib/api";
import { cn, scoreColor, STATUS_COLORS, STATUS_LABELS, timeAgo, formatSalary } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, RefreshCw, SkipForward, Star, ArrowRight,
  ExternalLink, MapPin, Building2, Check, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const PAGE_SIZE = 50;

/** Debounce a value by `delay` ms — prevents re-filtering on every keystroke */
function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(value), delay);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [value, delay]);
  return debounced;
}

const TABS: { value: string; label: string; statuses?: JobStatus[] }[] = [
  { value: "all", label: "All" },
  { value: "discovered", label: "Discovered", statuses: ["discovered"] },
  { value: "ready", label: "Ready", statuses: ["ready"] },
  { value: "applied", label: "Applied", statuses: ["applied"] },
  { value: "in_progress", label: "In Progress", statuses: ["in_progress"] },
  { value: "skipped", label: "Skipped", statuses: ["skipped"] },
];

function JobsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const tab = searchParams.get("status") ?? "all";
  const debouncedSearch = useDebounced(search, 250);

  const tabDef = TABS.find((t) => t.value === tab) ?? TABS[0];

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["jobs", tab],
    queryFn: () => api.jobs.list(tabDef.statuses),
    refetchInterval: 45_000,   // reduced from 20s — list is large
    staleTime: 30_000,
  });

  const bulkAction = useMutation({
    mutationFn: ({ action, ids }: { action: "skip" | "rescore" | "move_to_ready"; ids: string[] }) =>
      api.jobs.action(action, ids),
    onSuccess: (result, vars) => {
      toast.success(`${vars.action}: ${result.succeeded}/${result.requested} succeeded`);
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: () => toast.error("Bulk action failed"),
  });

  // Filter uses debounced value so we don't re-filter on every keystroke
  const filteredJobs = useMemo(() => {
    const all = data?.jobs ?? [];
    if (!debouncedSearch.trim()) return all;
    const q = debouncedSearch.toLowerCase();
    return all.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.employer.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q) ||
        j.source?.toLowerCase().includes(q)
    );
  }, [data, debouncedSearch]);

  // Pagination: slice into pages of PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const jobs = useMemo(
    () => filteredJobs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filteredJobs, page],
  );

  // Reset to page 0 when filter changes
  useEffect(() => { setPage(0); }, [debouncedSearch, tab]);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === jobs.length) setSelected(new Set());
    else setSelected(new Set(jobs.map((j) => j.id)));
  };

  const setTab = (t: string) => {
    router.push(`/jobs?status=${t}`);
    setSelected(new Set());
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Jobs</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{data?.total ?? 0} total jobs</p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="gap-1">
              {t.label}
              {data?.byStatus && t.statuses && (
                <span className="text-xs opacity-60">
                  {t.statuses.reduce((s, st) => s + (data.byStatus[st] ?? 0), 0)}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search + bulk */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search title, employer, location…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-zinc-400">{selected.size} selected</span>
            <Button
              variant="outline" size="sm"
              onClick={() => bulkAction.mutate({ action: "move_to_ready", ids: [...selected] })}
            >
              <ArrowRight className="h-3.5 w-3.5" /> Ready
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => bulkAction.mutate({ action: "rescore", ids: [...selected] })}
            >
              <Star className="h-3.5 w-3.5" /> Rescore
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => bulkAction.mutate({ action: "skip", ids: [...selected] })}
            >
              <SkipForward className="h-3.5 w-3.5" /> Skip
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setSelected(new Set())}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Job list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-zinc-800/40 animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-zinc-400">No jobs found.</p>
            <p className="text-xs text-zinc-600 mt-1">Try running the pipeline or adjusting filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {/* Select all header */}
          <div className="flex items-center gap-3 px-3 py-1">
            <button
              onClick={toggleAll}
              className={cn(
                "h-4 w-4 rounded border shrink-0 flex items-center justify-center transition-colors",
                selected.size === jobs.length && jobs.length > 0
                  ? "bg-zinc-200 border-zinc-200"
                  : "border-zinc-600 hover:border-zinc-400"
              )}
            >
              {selected.size === jobs.length && jobs.length > 0 && <Check className="h-3 w-3 text-zinc-900" />}
            </button>
            <span className="text-xs text-zinc-500">Select all ({jobs.length})</span>
          </div>

          {jobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              selected={selected.has(job.id)}
              onToggle={() => toggleSelect(job.id)}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ["jobs"] })}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-zinc-500">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredJobs.length)} of {filteredJobs.length}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3 + i, totalPages - 7 + i));
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "h-7 w-7 rounded text-xs transition-colors",
                    p === page ? "bg-zinc-700 text-white font-medium" : "text-zinc-500 hover:bg-zinc-800"
                  )}
                >
                  {p + 1}
                </button>
              );
            })}
            <Button variant="ghost" size="icon-sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function JobRow({
  job,
  selected,
  onToggle,
  onRefresh,
}: {
  job: JobListItem;
  selected: boolean;
  onToggle: () => void;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const action = async (fn: () => Promise<unknown>, label: string) => {
    setLoading(label);
    try {
      await fn();
      toast.success(`${label} done`);
      onRefresh();
    } catch (e) {
      if (process.env.NODE_ENV === "development") console.warn(`[bulk action: ${label}]`, e);
      toast.error(`${label} failed`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors group",
      selected ? "border-zinc-600 bg-zinc-800/60" : "border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/30"
    )}>
      {/* Checkbox */}
      <button
        onClick={(e) => { e.preventDefault(); onToggle(); }}
        className={cn(
          "h-4 w-4 rounded border shrink-0 flex items-center justify-center transition-colors",
          selected ? "bg-zinc-200 border-zinc-200" : "border-zinc-600 hover:border-zinc-400"
        )}
      >
        {selected && <Check className="h-3 w-3 text-zinc-900" />}
      </button>

      {/* Score */}
      <div className="w-8 text-center shrink-0">
        {job.suitabilityScore != null ? (
          <span className={cn("text-sm font-bold tabular-nums", scoreColor(job.suitabilityScore))}>
            {job.suitabilityScore}
          </span>
        ) : (
          <span className="text-zinc-600 text-xs">—</span>
        )}
      </div>

      {/* Job info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link href={`/jobs/${job.id}`} className="text-sm font-medium text-zinc-100 hover:text-white truncate">
            {job.title}
          </Link>
          <span className={cn("px-1.5 py-0.5 rounded-full text-xs shrink-0", STATUS_COLORS[job.status])}>
            {STATUS_LABELS[job.status]}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-zinc-400">
            <Building2 className="h-3 w-3" /> {job.employer}
          </span>
          {job.location && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <MapPin className="h-3 w-3" /> {job.location}
            </span>
          )}
          {job.source && (
            <span className="text-xs text-zinc-600">{job.source}</span>
          )}
          {(job.salaryMin || job.salaryMax) && (
            <span className="text-xs text-zinc-400">{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-zinc-600 mr-2">{timeAgo(job.updatedAt)}</span>

        {job.status === "discovered" && (
          <Button
            variant="ghost" size="icon-sm"
            onClick={() => action(() => api.jobs.process(job.id), "Process")}
            disabled={loading === "Process"}
            title="Move to Ready"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
        {(job.status === "discovered" || job.status === "ready") && (
          <Button
            variant="ghost" size="icon-sm"
            onClick={() => action(() => api.jobs.skip(job.id), "Skip")}
            disabled={loading === "Skip"}
            title="Skip"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost" size="icon-sm"
          onClick={() => action(() => api.jobs.rescore(job.id), "Rescore")}
          disabled={loading === "Rescore"}
          title="Rescore"
        >
          <Star className="h-3.5 w-3.5" />
        </Button>
        <Link href={`/jobs/${job.id}`}>
          <Button variant="ghost" size="icon-sm" title="Open">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense>
      <JobsInner />
    </Suspense>
  );
}
