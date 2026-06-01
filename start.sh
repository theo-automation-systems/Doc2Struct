#!/bin/bash

echo ""
echo "  Doc2Struct — AI Document Processing"
echo "  ──────────────────────────────────"
echo ""

# Frontend
echo "  Starting frontend (Next.js)..."
cd frontend
npm install --silent 2>/dev/null
npm run dev &
FRONTEND_PID=$!
cd ..

# Backend (optional — skip if no venv)
if [ -f "backend/venv/bin/activate" ]; then
  echo "  Starting backend (FastAPI)..."
  cd backend
  source venv/bin/activate
  uvicorn main:app --reload --port 8000 &
  BACKEND_PID=$!
  cd ..
  echo ""
  echo "  Frontend → http://localhost:3000"
  echo "  Backend  → http://localhost:8000"
  echo "  API Docs → http://localhost:8000/docs"
else
  echo ""
  echo "  Frontend → http://localhost:3000"
  echo "  Backend  → not started (run: cd backend && pip install -r requirements.txt)"
fi

echo ""
echo "  Press Ctrl+C to stop."
echo ""

# Wait and clean up on exit
trap "echo ''; echo '  Stopping...'; kill $FRONTEND_PID $BACKEND_PID 2>/dev/null; exit" INT TERM
wait
