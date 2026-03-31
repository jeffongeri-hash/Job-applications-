"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Briefcase, GitBranch, Inbox,
  Settings, ExternalLink, Zap, Search, User, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/search", label: "Search", icon: Search },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/auto-apply", label: "Auto-Apply", icon: Send },
  { href: "/pipeline", label: "Pipeline", icon: GitBranch },
  { href: "/tracking", label: "Inbox", icon: Inbox },
];

const secondary = [
  { href: "/profile", label: "My Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="fixed left-0 top-0 h-full w-16 md:w-56 z-40 flex flex-col border-r border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-4 border-b border-zinc-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-200 shrink-0">
          <Zap className="h-4 w-4 text-zinc-900" />
        </div>
        <span className="hidden md:block text-sm font-bold text-white tracking-tight">JobOps</span>
      </div>

      {/* Primary nav */}
      <nav className="flex flex-col gap-0.5 p-2 mt-2">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive(href)
                ? "bg-zinc-800 text-white font-medium"
                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden md:block">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-3 my-1 h-px bg-zinc-800" />

      {/* Secondary nav */}
      <nav className="flex flex-col gap-0.5 px-2">
        {secondary.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive(href)
                ? "bg-zinc-800 text-white font-medium"
                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden md:block">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto p-3 border-t border-zinc-800">
        <a
          href="https://github.com/DaKheera47/job-ops"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden md:block">job-ops v0.2</span>
        </a>
      </div>
    </aside>
  );
}
