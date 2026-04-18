<div align="center">
  <img src="public/IMG_0615.PNG" width="160" alt="Etac" />
</div>

# Etac

**Etac** is our product: the AI-assisted **sales operations agent** and the branded console (“Etac · PRODUCT SALES”) that reps actually use. It is the layer where **catalog, leads, and conversation transcripts** stay in sync—backed by HappyRobot **Twin** data (`etac_products`, `etac_leads`, `etac_transcript`, …), not scattered spreadsheets or one-off scripts. Humans stay in control (pause, take over, review); Etac handles the heavy lifting of structured outreach and context.

Etac 是我們對外產品名稱：不只是聊天機器人外掛，而是**業務每天進來操作的那個工作台**——串商品、名單與對話紀錄，並與後端 Twin API 對接。

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

**Vercel:** `vercel.json` rewrites client-side routes (e.g. `/leads/1`) to `index.html` so refresh/deep links do not 404.

## Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set your API key in `backend/.env`:

```env
HAPPYROBOT_API_KEY=sk_live_xxx
```

Run backend (from `backend/`):

```bash
uvicorn app.main:app --reload --port 8000
```

## Deploy backend on Render

This repo is a **monorepo** (`backend/` is not the git root). Options:

1. **Blueprint:** use `render.yaml` at the repo root (`buildCommand` installs `backend/requirements.txt`, `startCommand` runs `start.sh` which `cd`s into `backend/` before `uvicorn`).
2. **Manual service:** set **Build** to `pip install -r backend/requirements.txt`, **Start** to `bash start.sh`, and leave **Root Directory** empty (or the repo root).

Set secrets in Render: `HAPPYROBOT_API_KEY`, and optionally `HAPPYROBOT_BASE_URL` for the EU platform.

### CORS

If the frontend is on another origin, add that origin in `backend/app/main.py` (`CORSMiddleware`) and redeploy the API.

## Backend API

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

## Quick Test

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/schema
curl http://127.0.0.1:8000/api/products
curl http://127.0.0.1:8000/api/leads
```
