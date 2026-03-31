# JobOps Frontend

A dark-themed Next.js 16 frontend for [job-ops](https://github.com/DaKheera47/job-ops) — the self-hosted job application automation pipeline.

## Features

- **Dashboard** — live stats, 7-day activity chart, score distribution, pipeline funnel
- **Jobs browser** — tabbed by status, search, bulk skip/rescore/move-to-ready, per-job actions
- **Job detail** — full metadata, AI summary, suitability reasoning, application timeline, PDF generation
- **Pipeline control** — source toggles, topN/minScore params, live SSE progress log, run history
- **Automation scheduler** — cron-based schedule builder for hands-free pipeline runs
- **Tracking inbox** — review AI-detected recruiter emails, approve/deny with one click
- **Settings** — LLM model, RxResume, security, webhooks, danger zone

## Prerequisites

A running [job-ops](https://github.com/DaKheera47/job-ops) instance:

```bash
git clone https://github.com/DaKheera47/job-ops
cd job-ops
docker compose up -d
# Backend available at http://localhost:3005
```

## Setup

```bash
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_JOB_OPS_URL to your job-ops URL

npm install
npm run dev
# Open http://localhost:3000
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_JOB_OPS_URL` | `http://localhost:3005` | job-ops API base URL (client-side) |
| `JOB_OPS_URL` | `http://localhost:3005` | job-ops API base URL (Next.js rewrite proxy) |

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS v4
- Radix UI primitives
- TanStack Query v5
- Recharts
- Sonner toasts
- date-fns

## Automation Improvements Over Stock job-ops UI

1. **Source-level toggles** — enable/disable individual job boards per run
2. **Live SSE progress log** — real-time streaming of pipeline stages in the browser
3. **Cron schedule builder** — UI presets + custom cron expression with Docker/systemd notes
4. **Bulk operations** — select-all, bulk skip/rescore/move-to-ready across filtered job views
5. **Score heatmap** — visual bar chart of suitability score distribution
6. **Pipeline funnel** — see conversion rates across all application stages at a glance
