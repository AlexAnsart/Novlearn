@echo off
echo ====================================
echo   Novlearn
echo   Démarrage de l'environnement de développement
echo ====================================
echo.

echo [1/2] Démarrage du backend FastAPI...
start "Backend FastAPI" cmd /k "cd backend && python -m venv venv 2>nul && venv\Scripts\activate && pip install -r requirements.txt >nul 2>&1 && python main.py"

timeout /t 3 /nobreak >nul

echo [2/2] Démarrage du frontend Next.js...
start "Frontend Next.js" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo ====================================
echo   Serveurs démarrés !
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo ====================================
echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause >nul

