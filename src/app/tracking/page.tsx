"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, InboxItem } from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Inbox, CheckCircle, XCircle, RefreshCw, Mail, Building2,
  TrendingUp, ThumbsUp, ThumbsDown, AlertCircle, Clock,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const STAGE_LABELS: Record<string, string> = {
  interview_1: "Phone Screen",
  interview_2: "Technical Interview",
  interview_3: "Final Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const CONFIDENCE_COLORS = (c?: number) => {
  if (!c) return "text-zinc-500";
  if (c >= 0.8) return "text-emerald-400";
  if (c >= 0.5) return "text-yellow-400";
  return "text-red-400";
};

export default function TrackingPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "denied">("pending");

  const { data: inbox, isLoading, refetch } = useQuery({
    queryKey: ["inbox", filter],
    queryFn: () => api.inbox.list({ limit: 50 }),
    refetchInterval: 30_000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, toStage }: { id: string; toStage?: string }) =>
      api.inbox.approve(id, { toStage }),
    onSuccess: () => {
      toast.success("Approved and stage updated");
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: () => toast.error("Approve failed"),
  });

  const denyMutation = useMutation({
    mutationFn: (id: string) => api.inbox.deny(id),
    onSuccess: () => {
      toast.info("Marked as not relevant");
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
    },
    onError: () => toast.error("Deny failed"),
  });

  const items = (inbox ?? []).filter((item) => filter === "all" || item.status === filter);

  const counts = {
    all: inbox?.length ?? 0,
    pending: inbox?.filter((i) => i.status === "pending").length ?? 0,
    approved: inbox?.filter((i) => i.status === "approved").length ?? 0,
    denied: inbox?.filter((i) => i.status === "denied").length ?? 0,
  };

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Tracking Inbox</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            AI-detected recruiter emails needing your review
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Gmail connect hint */}
      <div className="flex items-start gap-3 rounded-lg border border-yellow-700/30 bg-yellow-900/10 px-4 py-3">
        <AlertCircle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-300">
          <p className="font-medium text-yellow-300">Gmail integration required</p>
          <p className="text-zinc-400 mt-0.5">
            Connect your Gmail account in{" "}
            <Link href="/settings" className="underline text-zinc-300">Settings → Accounts</Link>{" "}
            to enable automatic email parsing and response detection.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1">
        {(["pending", "all", "approved", "denied"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-colors capitalize",
              filter === f
                ? "bg-zinc-800 text-zinc-100 font-medium"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            )}
          >
            {f}
            <span className="ml-1.5 text-xs opacity-60">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Inbox items */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-zinc-800/40 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Inbox className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium">
              {filter === "pending" ? "No pending items" : "No items"}
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              {filter === "pending"
                ? "You're all caught up! JobOps will notify you when new emails are detected."
                : "No items match this filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <InboxCard
              key={item.id}
              item={item}
              onApprove={(toStage) => approveMutation.mutate({ id: item.id, toStage })}
              onDeny={() => denyMutation.mutate(item.id)}
              loading={approveMutation.isPending || denyMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Stats summary */}
      {(inbox?.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Response Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{counts.all}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Detected</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">{counts.approved}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Actioned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-zinc-400">{counts.pending}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InboxCard({
  item,
  onApprove,
  onDeny,
  loading,
}: {
  item: InboxItem;
  onApprove: (toStage?: string) => void;
  onDeny: () => void;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPending = item.status === "pending";

  return (
    <Card className={cn(
      "transition-colors",
      item.status === "approved" && "border-emerald-800/50 bg-emerald-950/10",
      item.status === "denied" && "opacity-60",
    )}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "mt-1 rounded-full p-1.5 shrink-0",
            item.status === "approved" ? "bg-emerald-900/40" : "bg-zinc-800"
          )}>
            <Mail className={cn(
              "h-3.5 w-3.5",
              item.status === "approved" ? "text-emerald-400" : "text-zinc-400"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-zinc-100">{item.subject ?? "No subject"}</p>
                {item.from && (
                  <p className="text-xs text-zinc-400 mt-0.5">{item.from}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.confidence != null && (
                  <span className={cn("text-xs font-medium", CONFIDENCE_COLORS(item.confidence))}>
                    {Math.round(item.confidence * 100)}% conf.
                  </span>
                )}
                {item.receivedAt && (
                  <span className="text-xs text-zinc-600">{timeAgo(item.receivedAt)}</span>
                )}
              </div>
            </div>

            {/* Snippet */}
            {item.snippet && (
              <p className={cn(
                "text-xs text-zinc-400 mt-1.5 leading-relaxed",
                !expanded && "line-clamp-2"
              )}>
                {item.snippet}
              </p>
            )}
            {item.snippet && item.snippet.length > 120 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-zinc-500 hover:text-zinc-300 mt-0.5"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}

            {/* Job link + suggested stage */}
            <div className="flex items-center gap-3 mt-2.5 flex-wrap">
              {item.job && (
                <Link href={`/jobs/${item.jobId}`}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                  <Building2 className="h-3 w-3" /> {item.job.employer} — {item.job.title}
                </Link>
              )}
              {item.suggestedStage && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-zinc-500">Suggested:</span>
                  <span className="text-xs font-medium text-zinc-300">
                    {STAGE_LABELS[item.suggestedStage] ?? item.suggestedStage.replace(/_/g, " ")}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            {isPending && (
              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm" variant="success"
                  onClick={() => onApprove(item.suggestedStage)}
                  disabled={loading}
                  className="gap-1.5"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Approve{item.suggestedStage ? ` & Move to ${STAGE_LABELS[item.suggestedStage] ?? item.suggestedStage}` : ""}
                </Button>
                <Button
                  size="sm" variant="ghost"
                  onClick={onDeny}
                  disabled={loading}
                  className="gap-1.5 text-zinc-400"
                >
                  <ThumbsDown className="h-3.5 w-3.5" /> Not relevant
                </Button>
              </div>
            )}

            {item.status === "approved" && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5" /> Approved — application stage updated
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
