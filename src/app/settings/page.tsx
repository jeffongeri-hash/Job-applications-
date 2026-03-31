"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, AppSettings } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Save, RefreshCw, CheckCircle, AlertCircle, Eye, EyeOff,
  Cpu, Shield, Webhook, User, Database, Server,
} from "lucide-react";
import { toast } from "sonner";

function Section({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-zinc-400" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, hint, secret
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  secret?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-xs text-zinc-400 block mb-1.5">{label}</label>
      <div className="relative">
        <Input
          type={secret && !show ? "password" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {secret && (
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            onClick={() => setShow(!show)}
          >
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-zinc-600 mt-1">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.settings.get(),
  });

  const { data: profileStatus } = useQuery({
    queryKey: ["profile-status"],
    queryFn: () => api.profile.status(),
    refetchInterval: 30_000,
  });

  const [form, setForm] = useState<AppSettings>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm(settings);
      setDirty(false);
    }
  }, [settings]);

  const set = (key: keyof AppSettings, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => api.settings.patch(form),
    onSuccess: () => {
      toast.success("Settings saved");
      setDirty(false);
      refetch();
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const refreshProfile = async () => {
    try {
      await api.profile.refresh();
      toast.success("Profile cache cleared");
    } catch {
      toast.error("Failed to refresh profile");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-3xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 bg-zinc-800/40 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Configure your job-ops instance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {dirty && (
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="h-3.5 w-3.5" />
              {saveMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          )}
        </div>
      </div>

      {/* Profile status */}
      {profileStatus && (
        <div className={cn(
          "flex items-start gap-3 rounded-lg border px-4 py-3",
          profileStatus.ok
            ? "border-emerald-700/30 bg-emerald-900/10"
            : "border-red-700/30 bg-red-900/10"
        )}>
          {profileStatus.ok
            ? <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            : <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
          <div className="flex-1">
            <p className="text-xs font-medium text-zinc-200">
              {profileStatus.ok ? "Base resume connected" : "Base resume not configured"}
            </p>
            {profileStatus.error && (
              <p className="text-xs text-zinc-400 mt-0.5">{profileStatus.error}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={refreshProfile} className="text-xs">
            Refresh
          </Button>
        </div>
      )}

      {/* AI / LLM */}
      <Section title="AI Model" icon={Cpu}>
        <Field
          label="Model"
          value={form.model ?? ""}
          onChange={(v) => set("model", v)}
          placeholder="google/gemini-2.0-flash-exp"
          hint="OpenRouter model ID, OpenAI model name, or Ollama model name"
        />
        <Field
          label="LLM Provider base URL"
          value={form.llmBaseUrl ?? ""}
          onChange={(v) => set("llmBaseUrl", v)}
          placeholder="https://openrouter.ai/api/v1"
          hint="OpenAI-compatible endpoint. Leave blank for OpenAI default."
        />
        <Field
          label="API Key"
          value={form.llmApiKey ?? ""}
          onChange={(v) => set("llmApiKey", v)}
          placeholder="sk-…"
          secret
          hint="API key for your LLM provider"
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Min suitability score</label>
            <Input
              type="number" min={0} max={100}
              value={form.minSuitabilityScore ?? 60}
              onChange={(e) => set("minSuitabilityScore", Number(e.target.value))}
            />
            <p className="text-xs text-zinc-600 mt-1">Jobs below this score are filtered out</p>
          </div>
        </div>
      </Section>

      {/* Reactive Resume */}
      <Section title="Reactive Resume" icon={User}>
        <p className="text-xs text-zinc-400">
          JobOps uses your RxResume base resume to generate tailored PDFs. Self-host RxResume or use the cloud version.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(["v4", "v5"] as const).map((v) => (
            <button
              key={v}
              onClick={() => set("rxresumeMode", v)}
              className={cn(
                "rounded-lg border px-4 py-3 text-sm transition-colors",
                form.rxresumeMode === v
                  ? "border-zinc-500 bg-zinc-800 text-white"
                  : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
              )}
            >
              {v === "v4" ? "v4 (self-hosted)" : "v5 (cloud)"}
            </button>
          ))}
        </div>
        <Field
          label="RxResume URL"
          value={form.rxresumeUrl ?? ""}
          onChange={(v) => set("rxresumeUrl", v)}
          placeholder="http://localhost:3000"
          hint="Your RxResume instance URL"
        />
        {form.rxresumeMode === "v4" ? (
          <>
            <Field
              label="Email"
              value={form.rxresumeEmail ?? ""}
              onChange={(v) => set("rxresumeEmail", v)}
              placeholder="you@example.com"
            />
            <Field
              label="Password"
              value={form.rxresumePassword ?? ""}
              onChange={(v) => set("rxresumePassword", v)}
              secret
            />
          </>
        ) : (
          <Field
            label="API Key"
            value={form.rxresumeApiKey ?? ""}
            onChange={(v) => set("rxresumeApiKey", v)}
            placeholder="rxr_…"
            secret
          />
        )}
      </Section>

      {/* Security */}
      <Section title="Security" icon={Shield}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-200">Basic Auth</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Require authentication for write operations (POST/PATCH/DELETE)
            </p>
          </div>
          <Switch
            checked={form.basicAuthEnabled ?? false}
            onCheckedChange={(v) => set("basicAuthEnabled", v)}
          />
        </div>
      </Section>

      {/* Webhooks */}
      <Section title="Webhooks" icon={Webhook}>
        <Field
          label="Webhook URL"
          value={form.webhookUrl ?? ""}
          onChange={(v) => set("webhookUrl", v)}
          placeholder="https://hooks.zapier.com/…"
          hint="Fired when a job is applied or pipeline completes"
        />
        <Field
          label="Public base URL"
          value={form.publicBaseUrl ?? ""}
          onChange={(v) => set("publicBaseUrl", v)}
          placeholder="https://jobops.yourdomain.com"
          hint="Used to generate tracer links in outgoing webhooks"
        />
      </Section>

      {/* Danger zone */}
      <Section title="Danger Zone" icon={Database}>
        <p className="text-xs text-zinc-400">These actions are irreversible.</p>
        <div className="space-y-2">
          {(["skipped", "discovered"] as const).map((status) => (
            <div key={status} className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3">
              <div>
                <p className="text-sm text-zinc-300 capitalize">Delete all {status} jobs</p>
                <p className="text-xs text-zinc-500">Permanently remove all jobs with status: {status}</p>
              </div>
              <Button
                variant="destructive" size="sm"
                onClick={async () => {
                  if (!confirm(`Delete all ${status} jobs? This cannot be undone.`)) return;
                  try {
                    const r = await api.jobs.deleteByStatus(status);
                    toast.success(r.data?.message ?? "Deleted");
                  } catch {
                    toast.error("Delete failed");
                  }
                }}
              >
                Delete
              </Button>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3">
            <div>
              <p className="text-sm text-zinc-300">Delete low-score jobs</p>
              <p className="text-xs text-zinc-500">Remove all non-applied jobs below score 50</p>
            </div>
            <Button
              variant="destructive" size="sm"
              onClick={async () => {
                if (!confirm("Delete all jobs with score below 50? This cannot be undone.")) return;
                try {
                  const r = await api.jobs.deleteByScore(50);
                  toast.success(r.data?.message ?? `Deleted ${r.data?.count} jobs`);
                } catch {
                  toast.error("Delete failed");
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Section>

      {/* Floating save bar */}
      {dirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border border-zinc-700 bg-zinc-900 px-5 py-3 shadow-2xl">
          <p className="text-sm text-zinc-300">Unsaved changes</p>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving…" : "Save"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setForm(settings ?? {}); setDirty(false); }}>
            Discard
          </Button>
        </div>
      )}
    </div>
  );
}
