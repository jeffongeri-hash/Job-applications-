"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { loadProfile, saveProfile } from "@/lib/profile-store";
import type { SearchPreferences } from "@/lib/profile-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Search, MapPin, DollarSign, Briefcase, X, Plus,
  Play, Save, SlidersHorizontal, Building2, Globe,
  AlertCircle, Zap, CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ALL_SOURCES = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "indeed", label: "Indeed" },
  { id: "glassdoor", label: "Glassdoor" },
  { id: "adzuna", label: "Adzuna" },
  { id: "hiring_cafe", label: "HiringCafe" },
  { id: "startup_jobs", label: "startup.jobs" },
  { id: "working_nomads", label: "WorkingNomads" },
  { id: "gradcracker", label: "GradCracker" },
  { id: "uk_visa_jobs", label: "UK Visa Jobs" },
];

const REMOTE_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "remote", label: "Remote only" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site only" },
] as const;

const JOB_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
] as const;

const EXP_LEVELS = [
  { value: "entry", label: "Entry" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / Principal" },
] as const;

export default function SearchPage() {
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState<SearchPreferences | null>(null);
  const [dirty, setDirty] = useState(false);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set(ALL_SOURCES.map((s) => s.id)));
  const [kwInput, setKwInput] = useState("");
  const [locInput, setLocInput] = useState("");
  const [bkKwInput, setBkKwInput] = useState("");
  const [bkCoInput, setBkCoInput] = useState("");
  const [topN, setTopN] = useState(20);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    setPrefs(p.searchPrefs);
    setSelectedSources(new Set(ALL_SOURCES.map((s) => s.id)));
  }, []);

  const update = (patch: Partial<SearchPreferences>) => {
    setPrefs((prev) => prev ? { ...prev, ...patch } : prev);
    setDirty(true);
  };

  const save = () => {
    if (!prefs) return;
    const p = loadProfile();
    p.searchPrefs = prefs;
    saveProfile(p);
    setDirty(false);
    toast.success("Search preferences saved");
  };

  const addKeyword = (kw: string) => {
    if (!kw.trim()) return;
    update({ keywords: [...(prefs?.keywords ?? []), kw.trim()] });
    setKwInput("");
  };

  const addLocation = (loc: string) => {
    if (!loc.trim()) return;
    update({ locations: [...(prefs?.locations ?? []), loc.trim()] });
    setLocInput("");
  };

  const addBlacklistKw = (kw: string) => {
    if (!kw.trim()) return;
    update({ blacklistedKeywords: [...(prefs?.blacklistedKeywords ?? []), kw.trim()] });
    setBkKwInput("");
  };

  const addBlacklistCo = (co: string) => {
    if (!co.trim()) return;
    update({ blacklistedCompanies: [...(prefs?.blacklistedCompanies ?? []), co.trim()] });
    setBkCoInput("");
  };

  const toggleArray = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const runSearch = async () => {
    if (!prefs) return;
    if (prefs.keywords.length === 0) {
      toast.error("Add at least one keyword before searching");
      return;
    }
    setRunning(true);
    try {
      // Save preferences first so they persist for future runs
      const p = loadProfile();
      p.searchPrefs = prefs;
      saveProfile(p);

      await api.search.run({
        keywords: prefs.keywords,
        locations: prefs.locations,
        sources: [...selectedSources],
        topN,
        minScore: prefs.salaryMin ? 50 : 50,
        remoteOnly: prefs.remotePreference === "remote",
        // Full prefs synced as scoring hints to job-ops before the run
        prefs: {
          salaryMin: prefs.salaryMin,
          salaryMax: prefs.salaryMax,
          salaryCurrency: prefs.salaryCurrency,
          blacklistedKeywords: prefs.blacklistedKeywords,
          blacklistedCompanies: prefs.blacklistedCompanies,
          requireVisaSupport: prefs.requireVisaSupport,
          jobTypes: prefs.jobTypes,
          experienceLevels: prefs.experienceLevels,
        },
      });
      toast.success("Search started — salary, blacklists & filters synced to scorer");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-status"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Search failed: ${msg}`);
    } finally {
      setRunning(false);
    }
  };

  if (!prefs) return (
    <div className="p-6 space-y-4 max-w-3xl">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-40 bg-zinc-800/40 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Job Search</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Configure keywords, locations and filters — then run the search
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <Button variant="outline" size="sm" onClick={save}>
              <Save className="h-3.5 w-3.5" /> Save preferences
            </Button>
          )}
          <Button onClick={runSearch} disabled={running} size="sm" className="gap-1.5">
            {running
              ? <><span className="h-3.5 w-3.5 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" /> Searching…</>
              : <><Play className="h-3.5 w-3.5" /> Run Search</>}
          </Button>
        </div>
      </div>

      {/* Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" /> Keywords
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-zinc-400">
            Job titles, technologies, or skills to search for. The more specific, the better the results.
          </p>
          <div className="flex gap-2">
            <Input
              value={kwInput}
              onChange={(e) => setKwInput(e.target.value)}
              placeholder="e.g. Software Engineer, React Developer, Python…"
              onKeyDown={(e) => e.key === "Enter" && addKeyword(kwInput)}
              className="flex-1"
            />
            <Button variant="outline" onClick={() => addKeyword(kwInput)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {prefs.keywords.map((kw) => (
              <span key={kw} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-900/30 border border-blue-700/50 text-xs text-blue-300">
                {kw}
                <button onClick={() => update({ keywords: prefs.keywords.filter((k) => k !== kw) })} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {prefs.keywords.length === 0 && (
              <p className="text-xs text-zinc-600 italic">No keywords yet</p>
            )}
          </div>

          {/* Suggestions */}
          <div>
            <p className="text-xs text-zinc-600 mb-1.5">Suggestions:</p>
            <div className="flex flex-wrap gap-1.5">
              {["Software Engineer", "Full Stack Developer", "Frontend Engineer", "Data Engineer", "DevOps Engineer", "Product Manager", "UX Designer"].map((s) => (
                <button
                  key={s}
                  onClick={() => { if (!prefs.keywords.includes(s)) addKeyword(s); }}
                  disabled={prefs.keywords.includes(s)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs border transition-colors",
                    prefs.keywords.includes(s)
                      ? "border-zinc-700 text-zinc-600 cursor-not-allowed"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 cursor-pointer"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Locations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-zinc-400">
            Cities, regions, or countries. Leave empty to search globally.
          </p>
          <div className="flex gap-2">
            <Input
              value={locInput}
              onChange={(e) => setLocInput(e.target.value)}
              placeholder="e.g. London, Manchester, Remote UK…"
              onKeyDown={(e) => e.key === "Enter" && addLocation(locInput)}
              className="flex-1"
            />
            <Button variant="outline" onClick={() => addLocation(locInput)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {prefs.locations.map((loc) => (
              <span key={loc} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs text-zinc-300">
                <MapPin className="h-3 w-3" /> {loc}
                <button onClick={() => update({ locations: prefs.locations.filter((l) => l !== loc) })} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {prefs.locations.length === 0 && (
              <p className="text-xs text-zinc-600 italic">No locations (all locations will be searched)</p>
            )}
          </div>

          {/* Remote preference */}
          <div>
            <p className="text-xs text-zinc-400 mb-2">Work arrangement</p>
            <div className="flex gap-2 flex-wrap">
              {REMOTE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ remotePreference: opt.value })}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs border transition-colors",
                    prefs.remotePreference === opt.value
                      ? "border-zinc-500 bg-zinc-800 text-zinc-100 font-medium"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary & job type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Salary & Job Type
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Min salary</label>
              <Input
                type="number"
                value={prefs.salaryMin ?? ""}
                onChange={(e) => update({ salaryMin: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="40000"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Max salary</label>
              <Input
                type="number"
                value={prefs.salaryMax ?? ""}
                onChange={(e) => update({ salaryMax: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="90000"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Currency</label>
              <select
                value={prefs.salaryCurrency}
                onChange={(e) => update({ salaryCurrency: e.target.value })}
                className="w-full h-9 bg-zinc-800/50 border border-zinc-700 rounded-md text-sm text-zinc-100 px-3 focus:outline-none"
              >
                {["GBP", "USD", "EUR", "CAD", "AUD"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-xs text-zinc-400 mb-2">Job types</p>
            <div className="flex gap-2 flex-wrap">
              {JOB_TYPES.map((jt) => (
                <button
                  key={jt.value}
                  onClick={() => update({ jobTypes: toggleArray(prefs.jobTypes, jt.value) })}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs border transition-colors",
                    prefs.jobTypes.includes(jt.value)
                      ? "border-zinc-500 bg-zinc-800 text-zinc-100 font-medium"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  )}
                >
                  {jt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-zinc-400 mb-2">Experience level</p>
            <div className="flex gap-2 flex-wrap">
              {EXP_LEVELS.map((el) => (
                <button
                  key={el.value}
                  onClick={() => update({ experienceLevels: toggleArray(prefs.experienceLevels, el.value) })}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs border transition-colors",
                    prefs.experienceLevels.includes(el.value)
                      ? "border-zinc-500 bg-zinc-800 text-zinc-100 font-medium"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  )}
                >
                  {el.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-200">Require visa sponsorship</p>
              <p className="text-xs text-zinc-500 mt-0.5">Only show jobs from visa-sponsoring employers</p>
            </div>
            <Switch
              checked={prefs.requireVisaSupport}
              onCheckedChange={(v) => update({ requireVisaSupport: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Job boards */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" /> Job Boards
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setSelectedSources(new Set(ALL_SOURCES.map((s) => s.id)))}>All</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedSources(new Set())}>None</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {ALL_SOURCES.map((source) => {
              const active = selectedSources.has(source.id);
              return (
                <button
                  key={source.id}
                  onClick={() => {
                    const next = new Set(selectedSources);
                    active ? next.delete(source.id) : next.add(source.id);
                    setSelectedSources(next);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors text-xs",
                    active
                      ? "border-zinc-600 bg-zinc-800/60 text-zinc-200"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
                  )}
                >
                  <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", active ? "bg-emerald-400" : "bg-zinc-600")} />
                  {source.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Blacklists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <X className="h-4 w-4 text-red-400" /> Blacklists
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-zinc-400 mb-2">Keywords to skip (in title or description)</p>
            <div className="flex gap-2 mb-2">
              <Input value={bkKwInput} onChange={(e) => setBkKwInput(e.target.value)}
                placeholder="e.g. internship, junior, sales…"
                onKeyDown={(e) => e.key === "Enter" && addBlacklistKw(bkKwInput)} className="flex-1" />
              <Button variant="outline" onClick={() => addBlacklistKw(bkKwInput)}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {prefs.blacklistedKeywords.map((kw) => (
                <span key={kw} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/20 border border-red-800/40 text-xs text-red-300">
                  {kw}
                  <button onClick={() => update({ blacklistedKeywords: prefs.blacklistedKeywords.filter((k) => k !== kw) })}><X className="h-3 w-3" /></button>
                </span>
              ))}
              {prefs.blacklistedKeywords.length === 0 && <p className="text-xs text-zinc-600 italic">None</p>}
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-xs text-zinc-400 mb-2">Companies to skip</p>
            <div className="flex gap-2 mb-2">
              <Input value={bkCoInput} onChange={(e) => setBkCoInput(e.target.value)}
                placeholder="e.g. Company Name…"
                onKeyDown={(e) => e.key === "Enter" && addBlacklistCo(bkCoInput)} className="flex-1" />
              <Button variant="outline" onClick={() => addBlacklistCo(bkCoInput)}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {prefs.blacklistedCompanies.map((co) => (
                <span key={co} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/20 border border-red-800/40 text-xs text-red-300">
                  <Building2 className="h-3 w-3" /> {co}
                  <button onClick={() => update({ blacklistedCompanies: prefs.blacklistedCompanies.filter((c) => c !== co) })}><X className="h-3 w-3" /></button>
                </span>
              ))}
              {prefs.blacklistedCompanies.length === 0 && <p className="text-xs text-zinc-600 italic">None</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Run config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" /> Run Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Jobs per source (topN)</label>
            <Input type="number" min={1} max={50} value={topN} onChange={(e) => setTopN(Number(e.target.value))} className="w-32" />
            <p className="text-xs text-zinc-600 mt-1">Max {topN * selectedSources.size} jobs from {selectedSources.size} source{selectedSources.size !== 1 ? "s" : ""}</p>
          </div>
        </CardContent>
      </Card>

      {/* Run button */}
      <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-200">Ready to search</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {prefs.keywords.length} keyword{prefs.keywords.length !== 1 ? "s" : ""} ·{" "}
            {prefs.locations.length > 0 ? prefs.locations.join(", ") : "all locations"} ·{" "}
            {selectedSources.size} source{selectedSources.size !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={runSearch} disabled={running || prefs.keywords.length === 0} className="gap-1.5">
          {running
            ? <><span className="h-3.5 w-3.5 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" /> Searching…</>
            : <><Zap className="h-3.5 w-3.5" /> Search Jobs</>}
        </Button>
      </div>
    </div>
  );
}
