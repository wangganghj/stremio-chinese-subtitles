$ErrorActionPreference = 'Stop'

$bundledNode = 'C:\Users\WGANG\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$node = Get-Command node -ErrorAction SilentlyContinue
$server = Join-Path $PSScriptRoot 'src\server.js'
$envFile = Join-Path $PSScriptRoot '.env'
$nodeArgs = @()
if (Test-Path -LiteralPath $envFile) {
    $nodeArgs += "--env-file=$envFile"
}
$nodeArgs += $server

if ($node) {
    & $node.Source @nodeArgs
} elseif (Test-Path -LiteralPath $bundledNode) {
    & $bundledNode @nodeArgs
} else {
    throw '没有找到 Node.js。请先安装 Node.js 20 或更高版本：https://nodejs.org/'
}
