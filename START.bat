@echo off
REM Parqueos Esquipulas - Quick Start (Windows)
REM This script installs dependencies and starts the server

cls
echo.
echo  ========================
echo  ^|   PARQUEOS ESQUIPULAS   ^|
echo  ^|   DEMO - Arranque Rapido ^|
echo  ========================
echo.

REM Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado
    echo Descarga desde: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detectado
node -v
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo [INSTALANDO] Dependencias...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Fallo al instalar dependencias
        pause
        exit /b 1
    )
    echo.
)

echo [OK] Dependencias instaladas
echo.

REM Start the server
echo [INICIANDO] Servidor Express...
echo.
echo ╔════════════════════════════════════╗
echo ║   SERVIDOR INICIADO CORRECTAMENTE   ║
echo ║   Abre: http://localhost:3000       ║
echo ╚════════════════════════════════════╝
echo.
echo USUARIOS DE PRUEBA:
echo  - juan@mail.com       (Visitante) - Pass: 1234
echo  - ana@mail.com        (Anfitrion) - Pass: 1234
echo  - admin@parqueos.com  (Admin)     - Pass: 1234
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

node server.js
