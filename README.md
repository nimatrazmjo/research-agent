# Research Agent

## Prerequisites

- Python 3.12+
- Node 20+

## Backend (terminal 1)

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Frontend (terminal 2)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173 — should show **Backend: ok**.
