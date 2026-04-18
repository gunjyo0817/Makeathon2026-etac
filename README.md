# Makeathon Hangarian

Frontend + FastAPI backend for ETAC products/leads workflows using HappyRobot Twin APIs.

## What This Website Does

This project is a lightweight sales operations console for ETAC.
It helps teams manage product data, capture incoming leads, and run lead handling flows with HappyRobot-backed data.

Core goals:

- Keep product catalog data queryable and editable from one interface
- Track lead lifecycle (new -> contacted -> qualified -> won/lost)
- Let frontend features consume a stable backend API instead of calling HappyRobot directly
- Make future AI/automation workflows easier by keeping schema and data access centralized

## Key Features

- Product management powered by `etac_products`
- Lead management powered by `etac_leads`
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

## Prerequisites

- Node.js 18+
- Python 3.10+

## Frontend Setup

```bash
npm install
npm run dev
```

Frontend runs on `http://127.0.0.1:5173` (default Vite port unless configured).

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

Run backend:

```bash
uvicorn app.main:app --reload --port 8000
```

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

## Quick Test

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/schema
curl http://127.0.0.1:8000/api/products
curl http://127.0.0.1:8000/api/leads
```
