$ErrorActionPreference = 'Stop'

$bundledPnpm = 'C:\Users\WGANG\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd'

if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    & pnpm install
} elseif (Test-Path -LiteralPath $bundledPnpm) {
    & $bundledPnpm install --no-frozen-lockfile --ignore-scripts
} elseif (Get-Command npm -ErrorAction SilentlyContinue) {
    & npm install
} else {
    throw '没有找到 pnpm 或 npm。请先安装 Node.js 20 或更高版本：https://nodejs.org/'
}
