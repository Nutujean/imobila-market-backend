@echo off
echo 🔄 Închid procesele de pe portul 5000...

FOR /F "tokens=5" %%a IN ('netstat -ano ^| findstr :5000') DO taskkill /PID %%a /F >nul 2>&1

echo ✅ Port 5000 este liber acum.
echo 🚀 Pornesc backend-ul...

npm run dev

pause
