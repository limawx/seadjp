@echo off
title Central de TI - Servidor
color 0A

echo ========================================
echo    CENTRAL DE TI - SERVIDOR LOCAL
echo ========================================
echo.

echo Iniciando servidor...
echo.

REM Tenta usar Python primeiro
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Usando Python...
    python server.py
    goto :end
)

REM Se não tiver Python, tenta Node.js
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo Usando Node.js...
    echo Instalando dependencias (primeira vez apenas)...
    npm install
    echo.
    echo Iniciando servidor...
    npm start
    goto :end
)

echo ERRO: Python ou Node.js nao encontrado!
echo.
echo Instale Python de: https://python.org
echo Ou Node.js de: https://nodejs.org
echo.
pause

:end
echo.
echo Servidor parado.
pause 