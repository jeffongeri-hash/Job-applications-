#!/usr/bin/env sh
# setup.sh — initialise the repo after a fresh clone
# Run once: sh setup.sh
set -e

echo "Initialising submodules..."
git submodule update --init --recursive

echo "Copying env file..."
[ -f .env.local ] || cp .env.example .env.local

echo ""
echo "Done. Next steps:"
echo "  Local dev:      npm install && npm run dev"
echo "  Docker (full):  docker compose up -d"
echo "  Naukri service: docker compose --profile naukri up -d"
echo ""
echo "Railway deployment:"
echo "  Push to GitHub, then follow the instructions in railway.toml"
