@echo off
chcp 65001 >nul

echo.
echo   Doc2Struct — AI Document Processing
echo   ──────────────────────────────────
echo.

:: Frontend
echo   Starting frontend (Next.js)...
cd frontend
start "Doc2Struct Frontend" cmd /k "npm run dev"
cd ..

:: Backend (optional — skip if no venv)
if exist "backend\venv\Scripts\activate.bat" (
    echo   Starting backend (FastAPI^)...
    cd backend
    start "Doc2Struct Backend" cmd /k "call venv\Scripts\activate && uvicorn main:app --reload --port 8000"
    cd ..
    echo.
    echo   Frontend  →  http://localhost:3000
    echo   Backend   →  http://localhost:8000
    echo   API Docs  →  http://localhost:8000/docs
) else (
    echo.
    echo   Frontend  →  http://localhost:3000
    echo   Backend   →  not started
    echo               ^(run: cd backend ^&^& pip install -r requirements.txt^)
)

echo.
echo   Opening browser...
timeout /t 3 >nul
start http://localhost:3000

echo.
pause
