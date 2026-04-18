# FastAPI backend for HappyRobot Twin

## 1) Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Then set `HAPPYROBOT_API_KEY` in `.env`.

## 2) Run

```bash
uvicorn app.main:app --reload --port 8000
```

## 3) Endpoints

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
