<div align="center">
  <img src="public/IMG_0615.PNG" width="160" alt="Etac" />
</div>

# Etac

**Etac** is our product: the AI-assisted **sales operations agent** and the branded console (“Etac · PRODUCT SALES”) that reps actually use. It is the layer where **catalog, leads, and conversation transcripts** stay in sync—backed by HappyRobot **Twin** data (`etac_products`, `etac_leads`, `etac_transcript`, …), not scattered spreadsheets or one-off scripts. Humans stay in control (pause, take over, review); Etac handles the heavy lifting of structured outreach and context. 

---

## Makeathon Hangarian (this repository)

Frontend + FastAPI backend that powers the Etac web app and proxies HappyRobot Twin APIs.

## What This Website Does

This project implements the Etac console: a lightweight sales operations UI for teams selling with structured product data (e.g. furniture), lead pipelines, and transcript-backed conversation views.
It helps teams manage product data, capture incoming leads, and run lead handling flows with HappyRobot-backed data.

Core goals:

- Keep product catalog data queryable and editable from one interface
- Track lead lifecycle (new -> contacted -> qualified -> won/lost)
- Let frontend features consume a stable backend API instead of calling HappyRobot directly
- Make future AI/automation workflows easier by keeping schema and data access centralized

## Key Features

- Product management powered by `etac_products`
- Lead management powered by `etac_leads`
- Lead conversation transcripts from `etac_transcript` (parsed in the UI)
- Backend proxy for HappyRobot Twin schema/table/sql APIs
- Typed FastAPI endpoints for safer request/response handling
- Centralized error mapping from HappyRobot responses to clean HTTP errors

## Architecture Overview

Request/data flow:

1. User interacts with React frontend pages (`src/`)
2. Frontend calls FastAPI backend endpoints (`backend/app/main.py`)
3. Backend signs and forwards requests to HappyRobot Twin API
4. Response is normalized and returned to frontend

## Stack

- Frontend: Vite + React + TypeScript
- Backend: FastAPI + httpx
- Data API: HappyRobot Twin (`https://platform.eu.happyrobot.ai/api/v2`)

## Project Structure

- `src/` - frontend app
- `backend/` - FastAPI backend service
- `vercel.json` - SPA fallback (client-side routes like `/leads/:id` resolve to `index.html` on refresh)
- `render.yaml` / `start.sh` - optional Render deploy (monorepo: start from repo root)

## Prerequisites

- Node.js 18+
- Python 3.10+

## Frontend Setup

```bash
npm install
npm run dev
```

Default dev URL: `http://127.0.0.1:5173`.

### Pointing the frontend at a backend

The client uses `VITE_API_BASE_URL` (see `src/lib/api.ts`). By default it falls back to `http://127.0.0.1:8000`.

At the **repository root** (next to `package.json`), create `.env.local`:

```env
VITE_API_BASE_URL=https://your-backend.example.com
```

No trailing slash. Restart `npm run dev` after changing env files.

For production hosting (Vercel, Netlify, etc.), set the same variable in the host’s environment settings and rebuild.

### Vercel

Point `VITE_API_BASE_URL` at your deployed API (e.g. Render). `vercel.json` rewrites requests to `index.html` so client routes (e.g. `/leads/1`) survive refresh and deep links.

## Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set secrets in `backend/.env` (see `backend/.env.example`):

```env
HAPPYROBOT_API_KEY=sk_live_xxx
# Browser CORS: "*" = any origin (default). Comma list for explicit origins + credentials.
CORS_ORIGINS=*
```

Run backend (from `backend/`):

```bash
uvicorn app.main:app --reload --port 8000
```

## Deploy backend on Render

This repo is a **monorepo** (`backend/` is not the git root). Options:

1. **Blueprint:** use `render.yaml` at the repo root (`buildCommand` installs `backend/requirements.txt`, `startCommand` runs `start.sh` which `cd`s into `backend/` before `uvicorn`).
2. **Manual service:** set **Build** to `pip install -r backend/requirements.txt`, **Start** to `bash start.sh`, and leave **Root Directory** empty (or the repo root).

Set secrets in Render: `HAPPYROBOT_API_KEY`, and optionally `HAPPYROBOT_BASE_URL` for the EU platform. Set `CORS_ORIGINS` if the SPA is on a different host (default `*` is fine for typical API-key flows).

### CORS

Configured via `CORS_ORIGINS` in `backend/.env` (see `backend/app/config.py` / `main.py`). `*` allows any browser origin without credentials; a comma-separated list merges with dev localhost origins and enables credentials.

### Lead scheduling (HappyRobot → Gmail)

Flow: HappyRobot **POST**s lead JSON to our webhook → sales **POST**s available slots → we **POST** JSON to `HAPPYROBOT_OUTBOUND_WEBHOOK_URL` (your HR workflow / mail step) with `booking_url` → lead opens **`/book/:token`** (public page, not linked from the Etac sidebar) and confirms a slot → we POST `booking_confirmed` to the same outbound URL.

Env (see `backend/.env.example`): `PUBLIC_APP_BASE_URL` (e.g. `https://your-app.vercel.app`, no trailing slash), optional `BOOKING_WEBHOOK_SECRET` / `BOOKING_SERVICE_SECRET`, and `HAPPYROBOT_OUTBOUND_WEBHOOK_URL`. Sessions are **in-memory** (restart clears them); swap for Twin or Redis when you need persistence.

## Backend API

- `GET /` — service name, links to `/health` and `/docs`
- `GET /health`
- `GET /api/schema`
- `GET /api/tables/{table_name}`
- `POST /api/tables/{table_name}/rows`
- `PATCH /api/tables/{table_name}/rows`
- `DELETE /api/tables/{table_name}/rows`
- `POST /api/sql`
- `GET /api/products`
- `POST /api/products`
- `GET /api/leads`
- `POST /api/leads`
- `GET /api/transcripts?customer_id=` — transcript rows for a lead (`customer_id` matches lead id)
- `GET /api/conversations/latest-assignment?lead_id=` — latest `etac_conversation` row for a lead (by `follow_up_date`), including assigned product id
- `POST /api/webhooks/happyrobot/lead` — ingest lead from HappyRobot; returns `booking_url` / `booking_token`
- `POST /api/booking/publish-slots` — sales publishes ISO slot list for a `lead_id`; triggers outbound notify
- `GET /api/booking/sessions/{token}` — includes `twin_slots`: all rows from `etac_meeting_slots` (shared sales pool for every lead; single rep assumption) plus in-memory `available_slots`
- `POST /api/booking/sessions/{token}/confirm` — in-memory: `{ "slot_start": "<iso>" }`. Twin: `{ "slot_id": <id>, "slot_start": "<iso>" }` (writes `etac_meetings`, deletes slot, then outbound)

## Quick Test

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/schema
curl http://127.0.0.1:8000/api/products
curl http://127.0.0.1:8000/api/leads
```
