import axios from "axios";

// The base URL is configurable via env var; defaults to the job-ops docker port
export const API_BASE =
  process.env.NEXT_PUBLIC_JOB_OPS_URL || "http://localhost:3005";

const client = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { "Content-Type": "application/json" },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type JobStatus = "discovered" | "ready" | "applied" | "in_progress" | "skipped" | "closed";

export interface Job {
  id: string;
  title: string;
  employer: string;
  location?: string;
  jobUrl?: string;
  source?: string;
  status: JobStatus;
  suitabilityScore?: number;
  suitabilityReasoning?: string;
  tailoredSummary?: string;
  tailoredHeadline?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  deadline?: number;
  appliedAt?: number;
  closedAt?: number;
  outcome?: string;
  pdfPath?: string;
  tracerLinksEnabled?: boolean;
  sponsorMatchScore?: number;
  sponsorMatchNames?: string;
  jobDescription?: string;
  createdAt: number;
  updatedAt: number;
}

export interface JobListItem {
  id: string;
  title: string;
  employer: string;
  location?: string;
  source?: string;
  status: JobStatus;
  suitabilityScore?: number;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  createdAt: number;
  updatedAt: number;
}

export interface JobsResponse {
  jobs: JobListItem[];
  total: number;
  byStatus: Record<string, number>;
  revision: string;
}

export interface PipelineStatus {
  isRunning: boolean;
  lastRun?: { id: string; startedAt: number; completedAt?: number; status: string; jobsFound: number };
  nextScheduledRun?: number;
}

export interface PipelineRun {
  id: string;
  startedAt: number;
  completedAt?: number;
  status: "running" | "completed" | "failed" | "cancelled";
  jobsFound: number;
  sources?: string[];
  error?: string;
}

export interface StageEvent {
  id: string;
  jobId: string;
  toStage: string;
  fromStage?: string;
  occurredAt: number;
  metadata?: Record<string, unknown>;
  outcome?: string;
}

export interface InboxItem {
  id: string;
  subject?: string;
  from?: string;
  snippet?: string;
  receivedAt?: number;
  suggestedStage?: string;
  confidence?: number;
  jobId?: string;
  job?: JobListItem;
  status: "pending" | "approved" | "denied";
}

export interface AppSettings {
  model?: string;
  llmProvider?: string;
  llmApiKey?: string;
  llmBaseUrl?: string;
  rxresumeMode?: "v4" | "v5";
  rxresumeUrl?: string;
  rxresumeEmail?: string;
  rxresumePassword?: string;
  rxresumeApiKey?: string;
  minSuitabilityScore?: number;
  basicAuthEnabled?: boolean;
  webhookUrl?: string;
  publicBaseUrl?: string;
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export const api = {
  jobs: {
    list: (statuses?: JobStatus[]) =>
      client
        .get<JobsResponse>("/jobs", {
          params: { status: statuses?.join(","), view: "list" },
        })
        .then((r) => r.data),

    get: (id: string) =>
      client.get<{ success: boolean; data: Job }>(`/jobs/${id}`).then((r) => r.data.data),

    action: (action: "skip" | "rescore" | "move_to_ready", jobIds: string[]) =>
      client.post("/jobs/actions", { action, jobIds }).then((r) => r.data),

    skip: (id: string) => client.post(`/jobs/${id}/skip`).then((r) => r.data),
    rescore: (id: string) => client.post(`/jobs/${id}/rescore`).then((r) => r.data),
    process: (id: string, force?: boolean) =>
      client.post(`/jobs/${id}/process`, null, { params: { force: force ? "1" : undefined } }).then((r) => r.data),
    summarize: (id: string) => client.post(`/jobs/${id}/summarize`).then((r) => r.data),
    generatePdf: (id: string) => client.post(`/jobs/${id}/generate-pdf`).then((r) => r.data),
    apply: (id: string) => client.post(`/jobs/${id}/apply`).then((r) => r.data),
    checkSponsor: (id: string) => client.post(`/jobs/${id}/check-sponsor`).then((r) => r.data),

    patch: (id: string, data: Partial<Job>) =>
      client.patch<Job>(`/jobs/${id}`, data).then((r) => r.data),

    events: (id: string) =>
      client.get<{ success: boolean; data: StageEvent[] }>(`/jobs/${id}/events`).then((r) => r.data.data),

    stage: (id: string, toStage: string, occurredAt?: number) =>
      client.post(`/jobs/${id}/stages`, { toStage, occurredAt }).then((r) => r.data),

    deleteByStatus: (status: JobStatus) =>
      client.delete(`/jobs/status/${status}`).then((r) => r.data),

    deleteByScore: (threshold: number) =>
      client.delete(`/jobs/score/${threshold}`).then((r) => r.data),
  },

  pipeline: {
    status: () => client.get<PipelineStatus>("/pipeline/status").then((r) => r.data),
    runs: () => client.get<PipelineRun[]>("/pipeline/runs").then((r) => r.data),
    run: (opts?: { topN?: number; minSuitabilityScore?: number; sources?: string[] }) =>
      client.post("/pipeline/run", opts).then((r) => r.data),
    cancel: () => client.post("/pipeline/cancel").then((r) => r.data),
    progressUrl: () => `${API_BASE}/api/pipeline/progress`,
  },

  inbox: {
    list: (params?: { provider?: string; limit?: number }) =>
      client.get<InboxItem[]>("/post-application/inbox", { params }).then((r) => r.data),
    approve: (id: string, data?: { toStage?: string }) =>
      client.post(`/post-application/inbox/${id}/approve`, data).then((r) => r.data),
    deny: (id: string) =>
      client.post(`/post-application/inbox/${id}/deny`).then((r) => r.data),
    bulkAction: (action: "approve" | "deny", messageIds: string[]) =>
      client.post("/post-application/inbox/actions", { action, messageIds }).then((r) => r.data),
  },

  settings: {
    get: () => client.get<AppSettings>("/settings").then((r) => r.data),
    patch: (data: Partial<AppSettings>) => client.patch<AppSettings>("/settings", data).then((r) => r.data),
    llmModels: (provider?: string, apiKey?: string, baseUrl?: string) =>
      client.post<{ models: string[] }>("/settings/llm-models", { provider, apiKey, baseUrl }).then((r) => r.data),
    rxResumes: (mode?: "v4" | "v5") =>
      client.get<{ resumes: { id: string; name: string }[] }>("/settings/rx-resumes", { params: { mode } }).then((r) => r.data),
  },

  profile: {
    status: () =>
      client.get<{ ok: boolean; error?: string }>("/profile/status").then((r) => r.data),
    refresh: () => client.post("/profile/refresh").then((r) => r.data),
  },

  onboarding: {
    get: () => client.get("/onboarding").then((r) => r.data),
  },

  /**
   * Manual job import — lets users paste a URL or raw description to add a job
   * directly without running the full pipeline.
   */
  manualJobs: {
    import: (data: { url?: string; title?: string; employer?: string; description?: string; location?: string }) =>
      client.post("/manual-jobs", data).then((r) => r.data),
  },

  /**
   * Search proxy — fires a targeted pipeline run restricted to specific keywords
   * and locations by injecting them as scoring hints in the settings patch.
   * The actual search still runs through job-ops extractors.
   */
  search: {
    run: (opts: {
      keywords: string[];
      locations: string[];
      sources?: string[];
      topN?: number;
      minScore?: number;
      remoteOnly?: boolean;
    }) =>
      client.post("/pipeline/run", {
        topN: opts.topN ?? 20,
        minSuitabilityScore: opts.minScore ?? 50,
        sources: opts.sources,
        // job-ops passes these through to extractors as query overrides
        searchKeywords: opts.keywords,
        searchLocations: opts.locations,
        remoteOnly: opts.remoteOnly ?? false,
      }).then((r) => r.data),
  },

  /**
   * Auto-apply queue — wraps the per-job process→summarize→pdf→apply flow
   * for a batch of ready jobs. Each step can be awaited individually so the
   * UI can show progress.
   */
  autoApply: {
    processJob: async (id: string) => {
      await client.post(`/jobs/${id}/process`);
      await client.post(`/jobs/${id}/summarize`);
      await client.post(`/jobs/${id}/generate-pdf`);
      return client.post(`/jobs/${id}/apply`).then((r) => r.data);
    },
    generateCoverLetter: (id: string, style: string, profileText: string) =>
      client.post(`/jobs/${id}/chat`, {
        message: `Write a ${style} cover letter for this job based on my profile:\n\n${profileText}`,
      }).then((r) => r.data),
  },
};
