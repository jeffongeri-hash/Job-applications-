# Uses the upstream pre-built image — no source build needed on Railway.
# This avoids the complex multi-stage build and cache-mount issues.
FROM ghcr.io/dakheera47/job-ops:latest

# Railway injects PORT; job-ops reads it via the PORT env var.
# The upstream image defaults PORT=3001 which Railway will override.
ENV NODE_ENV=production
ENV PYTHON_PATH=/usr/bin/python3
ENV DATA_DIR=/app/data
