@echo off
setlocal
where pnpm >nul 2>nul
if %errorlevel%==0 (
  pnpm install
  exit /b %errorlevel%
)
set "BUNDLED_PNPM=C:\Users\WGANG\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
if exist "%BUNDLED_PNPM%" (
  call "%BUNDLED_PNPM%" install --no-frozen-lockfile --ignore-scripts
  exit /b %errorlevel%
)
where npm >nul 2>nul
if %errorlevel%==0 (
  npm install
  exit /b %errorlevel%
)
echo Node.js 20+ was not found. Install it from https://nodejs.org/
exit /b 1
