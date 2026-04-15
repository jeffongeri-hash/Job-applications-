"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  loadProfile, saveProfile, saveSearch, deleteSavedSearch,
  type SearchPreferences, type SavedSearch, DEFAULT_SEARCH_PREFS,
} from "@/lib/profile-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Search, MapPin, DollarSign, X, Plus, Play, Save,
  SlidersHorizontal, Building2, Globe, Zap, Bookmark,
  Trash2, Clock, ChevronDown, ChevronUp, Navigation, Link2, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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

const RADIUS_OPTIONS = [5, 10, 15, 25, 50, 100];

export default function SearchPage() {
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState<SearchPreferences | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [dirty, setDirty] = useState(false);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(
    new Set(ALL_SOURCES.map((s) => s.id))
  );
  const [kwInput, setKwInput] = useState("");
  const [locInput, setLocInput] = useState("");
  const [zipInput, setZipInput] = useState("");
  const [bkKwInput, setBkKwInput] = useState("");
  const [bkCoInput, setBkCoInput] = useState("");
  const [topN, setTopN] = useState(20);
  const [running, setRunning] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showSaves, setShowSaves] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [naukriEmail, setNaukriEmail] = useState("");
  const [naukriPassword, setNaukriPassword] = useState("");
  const [naukriUrl, setNaukriUrl] = useState("");
  const [naukriLimit, setNaukriLimit] = useState(10);
  const [naukriRunning, setNaukriRunning] = useState(false);
  const [naukriStatus, setNaukriStatus] = useState<{ applied: number; failed: number; log: string[] } | null>(null);

  useEffect(() => {
    const p = loadProfile();
    setPrefs({ ...DEFAULT_SEARCH_PREFS, ...p.searchPrefs });
    setSavedSearches(p.savedSearches ?? []);
  }, []);

  const update = (patch: Partial<SearchPreferences>) => {
    setPrefs((prev) => prev ? { ...prev, ...patch } : prev);
    setDirty(true);
  };

  const persistPrefs = (p: SearchPreferences) => {
    const profile = loadProfile();
    profile.searchPrefs = p;
    saveProfile(profile);
  };

  const save = () => {
    if (!prefs) return;
    persistPrefs(prefs);
    setDirty(false);
    toast.success("Search preferences saved");
  };

  const handleSaveSearch = () => {
    if (!prefs || !saveName.trim()) { toast.error("Enter a name for this search"); return; }
    const entry = saveSearch(saveName.trim(), prefs);
    setSavedSearches((prev) => [entry, ...prev]);
    setSaveName("");
    toast.success(`Saved search "${entry.name}"`);
  };

  const handleLoadSearch = (ss: SavedSearch) => {
    setPrefs({ ...DEFAULT_SEARCH_PREFS, ...ss.prefs });
    setDirty(true);
    toast.success(`Loaded "${ss.name}"`);
  };

  const handleDeleteSearch = (id: string, name: string) => {
    deleteSavedSearch(id);
    setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    toast.info(`Deleted "${name}"`);
  };

  const addTag = (
    field: "keywords" | "locations" | "zipCodes" | "blacklistedKeywords" | "blacklistedCompanies",
    value: string,
    clear: () => void,
  ) => {
    if (!value.trim()) return;
    update({ [field]: [...(prefs?.[field] ?? []), value.trim()] });
    clear();
  };

  const removeTag = (
    field: "keywords" | "locations" | "zipCodes" | "blacklistedKeywords" | "blacklistedCompanies",
    value: string,
  ) => update({ [field]: (prefs?.[field] ?? []).filter((v) => v !== value) });

  const toggleArray = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const exportLinkedInConfig = async () => {
    setExporting(true);
    try {
      const profile = loadProfile();
      const res = await fetch("/api/export-linkedin-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Export failed");
      toast.success(
        `LinkedIn config written to ${data.targetDir} — add credentials to config/secrets.py then run python runAiBot.py`,
        { duration: 8000 }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Export failed";
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  };

  const runNaukri = async () => {
    if (!naukriEmail || !naukriPassword || !naukriUrl) {
      toast.error("Fill in Naukri credentials and filtered URL first");
      return;
    }
    setNaukriRunning(true);
    try {
      const res = await fetch("/api/naukri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: naukriEmail,
          password: naukriPassword,
          filteredUrl: naukriUrl,
          limit: naukriLimit,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start");
      toast.success("Naukri run started — check status below");
      // Poll status every 5s while running
      const poll = setInterval(async () => {
        const sr = await fetch("/api/naukri?action=status");
        const sd = await sr.json();
        setNaukriStatus(sd);
        if (!sd.running) clearInterval(poll);
      }, 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg);
    } finally {
      setNaukriRunning(false);
    }
  };

  const runSearch = async () => {
    if (!prefs) return;
    if (prefs.keywords.length === 0 && prefs.zipCodes.length === 0) {
      toast.error("Add at least one keyword or zip code before searching");
      return;
    }
    setRunning(true);
    try {
      persistPrefs(prefs);
      setDirty(false);
      await api.search.run({
        keywords: prefs.keywords,
        locations: prefs.locations,
        sources: [...selectedSources],
        topN,
        minScore: 50,
        remoteOnly: prefs.remotePreference === "remote",
        prefs: {
          salaryMin: prefs.salaryMin,
          salaryMax: prefs.salaryMax,
          salaryCurrency: prefs.salaryCurrency,
          blacklistedKeywords: prefs.blacklistedKeywords,
          blacklistedCompanies: prefs.blacklistedCompanies,
          requireVisaSupport: prefs.requireVisaSupport,
          jobTypes: prefs.jobTypes,
          experienceLevels: prefs.experienceLevels,
          zipCodes: prefs.zipCodes,
          radiusMiles: prefs.radiusMiles,
        },
      });
      toast.success("Search started — jobs will appear in the Jobs page shortly");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-status"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Search failed: ${msg}`);
    } finally {
      setRunning(false);
    }
  };

  if (!prefs) {
    return (
      <div className="p-6 space-y-4 max-w-3xl">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 bg-zinc-800/40 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Job Search</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Configure keywords, locations, zip codes and filters — then run
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <Button variant="outline" size="sm" onClick={save}>
              <Save className="h-3.5 w-3.5" /> Save prefs
            </Button>
          )}
          <Button
            variant="outline" size="sm"
            onClick={exportLinkedInConfig}
            disabled={exporting}
            title="Generate Python config files for Auto_job_applier_linkedIn"
          >
            {exporting
              ? <span className="h-3.5 w-3.5 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
              : <Link2 className="h-3.5 w-3.5" />}
            LinkedIn config
          </Button>
          <Button onClick={runSearch} disabled={running} size="sm" className="gap-1.5">
            {running
              ? <><span className="h-3.5 w-3.5 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" /> Searching…</>
              : <><Play className="h-3.5 w-3.5" /> Run Search</>}
          </Button>
        </div>
      </div>

      {/* Saved searches panel */}
      <Card>
        <button
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-800/20 transition-colors rounded-xl"
          onClick={() => setShowSaves(!showSaves)}
        >
          <span className="flex items-center gap-2 text-sm font-medium text-zinc-200">
            <Bookmark className="h-4 w-4 text-zinc-400" />
            Saved searches
            {savedSearches.length > 0 && (
              <span className="text-xs text-zinc-500 font-normal">{savedSearches.length}</span>
            )}
          </span>
          {showSaves ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
        </button>

        {showSaves && (
          <CardContent className="pt-0 space-y-3 border-t border-zinc-800">
            {/* Save current as named search */}
            <div className="flex gap-2 pt-4">
              <Input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Name this search (e.g. Senior React London)…"
                onKeyDown={(e) => e.key === "Enter" && handleSaveSearch()}
                className="flex-1"
              />
              <Button variant="outline" onClick={handleSaveSearch}>
                <Bookmark className="h-3.5 w-3.5" /> Save
              </Button>
            </div>

            {savedSearches.length === 0 ? (
              <p className="text-xs text-zinc-600 text-center py-3 italic">No saved searches yet</p>
            ) : (
              <div className="space-y-1.5">
                {savedSearches.map((ss) => (
                  <div
                    key={ss.id}
                    className="flex items-start gap-3 rounded-lg border border-zinc-800 px-3 py-2.5 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200">{ss.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">
                        {[
                          ss.prefs.keywords.slice(0, 3).join(", "),
                          ss.prefs.locations.slice(0, 2).join(", "),
                          ss.prefs.zipCodes?.slice(0, 2).join(", "),
                        ].filter(Boolean).join(" · ") || "No keywords"}
                      </p>
                      <p className="text-xs text-zinc-600 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {format(ss.createdAt, "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => handleLoadSearch(ss)}
                        className="text-xs text-zinc-400 hover:text-zinc-100"
                      >
                        Load
                      </Button>
                      <Button
                        variant="ghost" size="icon-sm"
                        onClick={() => handleDeleteSearch(ss.id, ss.name)}
                        className="text-zinc-600 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-4 w-4" /> Keywords</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-zinc-400">Job titles, technologies, or skills to search for.</p>
          <div className="flex gap-2">
            <Input
              value={kwInput}
              onChange={(e) => setKwInput(e.target.value)}
              placeholder="e.g. Software Engineer, React Developer…"
              onKeyDown={(e) => e.key === "Enter" && addTag("keywords", kwInput, () => setKwInput(""))}
              className="flex-1"
            />
            <Button variant="outline" onClick={() => addTag("keywords", kwInput, () => setKwInput(""))}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <TagList
            tags={prefs.keywords}
            onRemove={(t) => removeTag("keywords", t)}
            color="bg-blue-900/30 border-blue-700/50 text-blue-300"
          />
          <div className="flex flex-wrap gap-1.5">
            {["Software Engineer", "Full Stack Developer", "Frontend Engineer", "Data Engineer",
              "DevOps Engineer", "Product Manager", "UX Designer", "Backend Engineer"].map((s) => (
              <button
                key={s}
                onClick={() => { if (!prefs.keywords.includes(s)) addTag("keywords", s, () => {}); }}
                disabled={prefs.keywords.includes(s)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition-colors",
                  prefs.keywords.includes(s)
                    ? "border-zinc-700 text-zinc-600 cursor-not-allowed"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 cursor-pointer"
                )}
              >{s}</button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Locations + Zip codes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Locations & Zip Codes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* City/region */}
          <div>
            <p className="text-xs text-zinc-400 mb-2">Cities or regions</p>
            <div className="flex gap-2">
              <Input
                value={locInput}
                onChange={(e) => setLocInput(e.target.value)}
                placeholder="e.g. London, New York, Remote UK…"
                onKeyDown={(e) => e.key === "Enter" && addTag("locations", locInput, () => setLocInput(""))}
                className="flex-1"
              />
              <Button variant="outline" onClick={() => addTag("locations", locInput, () => setLocInput(""))}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <TagList
              tags={prefs.locations}
              onRemove={(t) => removeTag("locations", t)}
              icon={<MapPin className="h-3 w-3" />}
              color="bg-zinc-800 border-zinc-700 text-zinc-300"
            />
          </div>

          <Separator />

          {/* Zip / postal codes */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="h-3.5 w-3.5 text-zinc-400" />
              <p className="text-xs text-zinc-400">Zip / postal codes</p>
              <span className="text-xs text-zinc-600 ml-auto">
                Searches within radius of each code
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                placeholder="e.g. SW1A 1AA, 10001, EC1A 1BB…"
                onKeyDown={(e) => e.key === "Enter" && addTag("zipCodes", zipInput, () => setZipInput(""))}
                className="flex-1 font-mono"
              />
              <Button variant="outline" onClick={() => addTag("zipCodes", zipInput, () => setZipInput(""))}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <TagList
              tags={prefs.zipCodes}
              onRemove={(t) => removeTag("zipCodes", t)}
              icon={<Navigation className="h-3 w-3" />}
              color="bg-purple-900/30 border-purple-700/50 text-purple-300"
            />
            {prefs.zipCodes.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-zinc-400">Search radius</p>
                  <span className="text-xs font-medium text-zinc-300">{prefs.radiusMiles} miles</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {RADIUS_OPTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => update({ radiusMiles: r })}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs border transition-colors",
                        prefs.radiusMiles === r
                          ? "border-zinc-400 bg-zinc-700 text-zinc-100 font-medium"
                          : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      )}
                    >
                      {r}mi
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Work arrangement */}
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
                >{opt.label}</button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary & job type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Salary & Job Type</CardTitle>
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
                >{jt.label}</button>
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
                >{el.label}</button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-200">Require visa sponsorship</p>
              <p className="text-xs text-zinc-500 mt-0.5">Only show jobs from visa-sponsoring employers</p>
            </div>
            <Switch checked={prefs.requireVisaSupport} onCheckedChange={(v) => update({ requireVisaSupport: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Job boards */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4" /> Job Boards</CardTitle>
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
            <p className="text-xs text-zinc-400 mb-2">Keywords to skip</p>
            <div className="flex gap-2 mb-2">
              <Input value={bkKwInput} onChange={(e) => setBkKwInput(e.target.value)}
                placeholder="e.g. internship, junior, sales…"
                onKeyDown={(e) => e.key === "Enter" && addTag("blacklistedKeywords", bkKwInput, () => setBkKwInput(""))}
                className="flex-1" />
              <Button variant="outline" onClick={() => addTag("blacklistedKeywords", bkKwInput, () => setBkKwInput(""))}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <TagList tags={prefs.blacklistedKeywords} onRemove={(t) => removeTag("blacklistedKeywords", t)}
              color="bg-red-900/20 border-red-800/40 text-red-300" />
          </div>
          <Separator />
          <div>
            <p className="text-xs text-zinc-400 mb-2">Companies to skip</p>
            <div className="flex gap-2 mb-2">
              <Input value={bkCoInput} onChange={(e) => setBkCoInput(e.target.value)}
                placeholder="e.g. Company Name…"
                onKeyDown={(e) => e.key === "Enter" && addTag("blacklistedCompanies", bkCoInput, () => setBkCoInput(""))}
                className="flex-1" />
              <Button variant="outline" onClick={() => addTag("blacklistedCompanies", bkCoInput, () => setBkCoInput(""))}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <TagList tags={prefs.blacklistedCompanies} onRemove={(t) => removeTag("blacklistedCompanies", t)}
              icon={<Building2 className="h-3 w-3" />}
              color="bg-red-900/20 border-red-800/40 text-red-300" />
          </div>
        </CardContent>
      </Card>

      {/* Run config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Run Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Jobs per source (topN)</label>
            <Input type="number" min={1} max={50} value={topN}
              onChange={(e) => setTopN(Number(e.target.value))} className="w-32" />
            <p className="text-xs text-zinc-600 mt-1">
              Up to {topN * selectedSources.size} total from {selectedSources.size} source{selectedSources.size !== 1 ? "s" : ""}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Naukri auto-applier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-orange-400" />
            Naukri Auto-Apply
            <span className="text-xs font-normal text-zinc-500 ml-1">— powered by Job-Hunter</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Automatically apply to Easy Apply jobs on{" "}
            <span className="text-orange-300 font-medium">Naukri.com</span>.
            Requires the Naukri service running:{" "}
            <code className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded">
              docker compose --profile naukri up -d
            </code>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Naukri email</label>
              <Input
                type="email"
                value={naukriEmail}
                onChange={(e) => setNaukriEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Password</label>
              <Input
                type="password"
                value={naukriPassword}
                onChange={(e) => setNaukriPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">
              Filtered Naukri search URL
              <span className="text-zinc-600 ml-1">— apply your filters on naukri.com then paste the URL</span>
            </label>
            <Input
              value={naukriUrl}
              onChange={(e) => setNaukriUrl(e.target.value)}
              placeholder="https://www.naukri.com/jobs-in-india?k=react+developer&l=bangalore"
            />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Apply limit</label>
              <Input
                type="number" min={1} max={50}
                value={naukriLimit}
                onChange={(e) => setNaukriLimit(Number(e.target.value))}
                className="w-24"
              />
            </div>
            <Button
              className="mt-5 gap-1.5"
              onClick={runNaukri}
              disabled={naukriRunning}
            >
              {naukriRunning
                ? <><span className="h-3.5 w-3.5 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" /> Starting…</>
                : <><Play className="h-3.5 w-3.5" /> Run on Naukri</>}
            </Button>
          </div>

          {naukriStatus && (
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-xs text-zinc-400">
                <span className="text-emerald-400 font-medium">{naukriStatus.applied} applied</span>
                <span className="text-red-400">{naukriStatus.failed} failed</span>
              </div>
              {naukriStatus.log.length > 0 && (
                <div className="bg-zinc-950 rounded-lg p-3 h-32 overflow-y-auto font-mono text-xs text-zinc-400 space-y-0.5">
                  {naukriStatus.log.slice(-20).map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Run CTA */}
      <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-200">Ready to search</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {prefs.keywords.length} keyword{prefs.keywords.length !== 1 ? "s" : ""} ·{" "}
            {prefs.locations.length + prefs.zipCodes.length > 0
              ? [...prefs.locations, ...prefs.zipCodes].join(", ")
              : "all locations"} ·{" "}
            {selectedSources.size} source{selectedSources.size !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={runSearch}
          disabled={running || (prefs.keywords.length === 0 && prefs.zipCodes.length === 0)}
          className="gap-1.5"
        >
          {running
            ? <><span className="h-3.5 w-3.5 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" /> Searching…</>
            : <><Zap className="h-3.5 w-3.5" /> Search Jobs</>}
        </Button>
      </div>
    </div>
  );
}

// ─── Reusable tag list ────────────────────────────────────────────────────────
function TagList({
  tags, onRemove, color, icon,
}: {
  tags: string[];
  onRemove: (t: string) => void;
  color: string;
  icon?: React.ReactNode;
}) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {tags.map((t) => (
        <span key={t} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs", color)}>
          {icon} {t}
          <button onClick={() => onRemove(t)} className="hover:text-white ml-0.5">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
