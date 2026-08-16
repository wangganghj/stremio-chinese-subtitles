@echo off
setlocal
set "SERVER=%~dp0src\server.js"
set "ENV_FILE=%~dp0.env"
where node >nul 2>nul
if %errorlevel%==0 (
  if exist "%ENV_FILE%" (node --env-file="%ENV_FILE%" "%SERVER%") else (node "%SERVER%")
  exit /b %errorlevel%
)
set "BUNDLED_NODE=C:\Users\WGANG\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%BUNDLED_NODE%" (
  if exist "%ENV_FILE%" ("%BUNDLED_NODE%" --env-file="%ENV_FILE%" "%SERVER%") else ("%BUNDLED_NODE%" "%SERVER%")
  exit /b %errorlevel%
)
echo Node.js 20+ was not found. Install it from https://nodejs.org/
exit /b 1
