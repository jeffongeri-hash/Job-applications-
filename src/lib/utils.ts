import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSalary(min?: number | null, max?: number | null, currency = "GBP"): string {
  if (!min && !max) return "Not specified";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export function timeAgo(ts: number | string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function scoreColor(score?: number | null): string {
  if (!score) return "text-zinc-400";
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

export function scoreBg(score?: number | null): string {
  if (!score) return "bg-zinc-800 text-zinc-300";
  if (score >= 75) return "bg-emerald-900/40 text-emerald-300 border border-emerald-700/50";
  if (score >= 50) return "bg-yellow-900/40 text-yellow-300 border border-yellow-700/50";
  return "bg-red-900/40 text-red-300 border border-red-700/50";
}

export const STATUS_LABELS: Record<string, string> = {
  discovered: "Discovered",
  ready: "Ready",
  applied: "Applied",
  in_progress: "In Progress",
  skipped: "Skipped",
  closed: "Closed",
};

export const STATUS_COLORS: Record<string, string> = {
  discovered: "bg-blue-900/40 text-blue-300 border border-blue-700/50",
  ready: "bg-purple-900/40 text-purple-300 border border-purple-700/50",
  applied: "bg-green-900/40 text-green-300 border border-green-700/50",
  in_progress: "bg-orange-900/40 text-orange-300 border border-orange-700/50",
  skipped: "bg-zinc-800 text-zinc-400 border border-zinc-700/50",
  closed: "bg-zinc-800 text-zinc-500 border border-zinc-700/50",
};
