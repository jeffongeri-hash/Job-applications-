# syntax=docker/dockerfile:1
# ── Stage 1: deps ─────────────────────────────────────────────────────────────
# BuildKit cache mount keeps the npm cache between rebuilds so packages are
# never re-downloaded — rebuild goes from ~3 min → ~20 s on a warm cache.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,id=jobops-npm,target=/root/.npm \
    npm ci --prefer-offline --no-audit --no-fund

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN --mount=type=cache,id=jobops-npm,target=/root/.npm \
    npm run build

# ── Stage 3: runner (minimal — only standalone output) ───────────────────────
# node:20-alpine is ~130 MB; standalone output strips unused Next.js internals.
# Final image size is typically 180–220 MB vs 1.2 GB for the full dev image.
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public          ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
