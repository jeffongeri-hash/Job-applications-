"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, scoreColor, scoreBg, STATUS_COLORS, STATUS_LABELS, timeAgo, formatSalary } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ExternalLink, MapPin, Building2, Star,
  FileText, Send, SkipForward, RefreshCw, CheckCircle,
  Clock, Calendar, Briefcase,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: () => api.jobs.get(id),
    refetchInterval: 45_000,
    staleTime: 30_000,
  });

  const { data: events } = useQuery({
    queryKey: ["job-events", id],
    queryFn: () => api.jobs.events(id),
    enabled: !!job,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["job", id] });
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
  };

  const action = async (fn: () => Promise<unknown>, label: string) => {
    try {
      await fn();
      toast.success(`${label} done`);
      refresh();
    } catch (e) {
      if (process.env.NODE_ENV === "development") console.warn(`[job action: ${label}]`, e);
      toast.error(`${label} failed`);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl">
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="h-40 bg-zinc-800/40 rounded-xl animate-pulse" />
        <div className="h-64 bg-zinc-800/40 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6">
        <p className="text-zinc-400">Job not found.</p>
        <Link href="/jobs"><Button variant="outline" className="mt-4">← Back to Jobs</Button></Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/jobs">
          <Button variant="ghost" size="icon-sm" className="mt-0.5">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-white">{job.title}</h1>
            <span className={cn("px-2 py-0.5 rounded-full text-xs", STATUS_COLORS[job.status])}>
              {STATUS_LABELS[job.status]}
            </span>
            {job.suitabilityScore != null && (
              <span className={cn("px-2.5 py-0.5 rounded-full text-sm font-bold", scoreBg(job.suitabilityScore))}>
                {job.suitabilityScore}/100
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-sm text-zinc-400">
              <Building2 className="h-3.5 w-3.5" /> {job.employer}
            </span>
            {job.location && (
              <span className="flex items-center gap-1 text-sm text-zinc-400">
                <MapPin className="h-3.5 w-3.5" /> {job.location}
              </span>
            )}
            {job.source && <span className="text-sm text-zinc-500">via {job.source}</span>}
            {job.jobUrl && (
              <a href={job.jobUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300">
                <ExternalLink className="h-3.5 w-3.5" /> View listing
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={refresh}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={() => action(() => api.jobs.rescore(id), "Rescore")}>
          <Star className="h-3.5 w-3.5" /> Rescore
        </Button>
        {job.status === "discovered" && (
          <Button variant="outline" size="sm" onClick={() => action(() => api.jobs.process(id), "Process")}>
            <CheckCircle className="h-3.5 w-3.5" /> Move to Ready
          </Button>
        )}
        {job.status === "ready" && (
          <>
            <Button variant="outline" size="sm" onClick={() => action(() => api.jobs.summarize(id), "Summarize")}>
              <FileText className="h-3.5 w-3.5" /> Generate Summary
            </Button>
            <Button variant="outline" size="sm" onClick={() => action(() => api.jobs.generatePdf(id), "PDF")}>
              <FileText className="h-3.5 w-3.5" /> Generate PDF
            </Button>
            <Button size="sm" onClick={() => action(() => api.jobs.apply(id), "Apply")}>
              <Send className="h-3.5 w-3.5" /> Mark Applied
            </Button>
          </>
        )}
        {(job.status === "discovered" || job.status === "ready") && (
          <Button variant="ghost" size="sm" onClick={() => action(() => api.jobs.skip(id), "Skip")}>
            <SkipForward className="h-3.5 w-3.5" /> Skip
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => action(() => api.jobs.checkSponsor(id), "Sponsor check")}>
          <Briefcase className="h-3.5 w-3.5" /> Check Sponsor
        </Button>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(job.salaryMin || job.salaryMax) && (
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-zinc-500 mb-1">Salary</p>
              <p className="text-sm font-medium text-zinc-200">{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</p>
            </CardContent>
          </Card>
        )}
        {job.createdAt && (
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-zinc-500 mb-1">Discovered</p>
              <p className="text-sm font-medium text-zinc-200">{format(new Date(job.createdAt), "MMM d, yyyy")}</p>
            </CardContent>
          </Card>
        )}
        {job.deadline && (
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-zinc-500 mb-1">Deadline</p>
              <p className="text-sm font-medium text-zinc-200">{format(new Date(job.deadline), "MMM d, yyyy")}</p>
            </CardContent>
          </Card>
        )}
        {job.sponsorMatchScore != null && (
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-zinc-500 mb-1">Sponsor Match</p>
              <p className={cn("text-sm font-bold", scoreColor(job.sponsorMatchScore))}>{job.sponsorMatchScore}%</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI summary */}
      {job.tailoredSummary && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-4 w-4 text-yellow-400" /> AI Tailored Summary</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300 leading-relaxed">{job.tailoredSummary}</p>
            {job.tailoredHeadline && (
              <p className="text-xs text-zinc-500 mt-2 italic">{job.tailoredHeadline}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Suitability reasoning */}
      {job.suitabilityReasoning && (
        <Card>
          <CardHeader><CardTitle>Suitability Reasoning</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{job.suitabilityReasoning}</p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {events && events.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Application Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="relative pl-4 space-y-3">
              <div className="absolute left-1.5 top-1 bottom-1 w-px bg-zinc-800" />
              {events.map((ev, i) => (
                <div key={ev.id} className="relative flex gap-3">
                  <div className="absolute -left-3 top-1 h-2 w-2 rounded-full bg-zinc-600 border border-zinc-900" />
                  <div>
                    <p className="text-sm font-medium text-zinc-200 capitalize">
                      {ev.toStage?.replace(/_/g, " ") ?? "Stage update"}
                    </p>
                    <p className="text-xs text-zinc-500">{format(new Date(ev.occurredAt), "MMM d, yyyy HH:mm")}</p>
                    {ev.outcome && <p className="text-xs text-zinc-400 mt-0.5">Outcome: {ev.outcome}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job description */}
      {job.jobDescription && (
        <Card>
          <CardHeader><CardTitle>Job Description</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto">
              {job.jobDescription}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
