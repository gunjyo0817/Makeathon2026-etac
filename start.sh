#!/usr/bin/env bash
# Render / monorepo: repo root is the service root, but FastAPI package lives in backend/app.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT/backend"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
