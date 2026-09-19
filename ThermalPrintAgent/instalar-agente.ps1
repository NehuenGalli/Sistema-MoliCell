param(
  [string]$Origin = 'https://molicell.store',
  [string]$PrinterName = ''
)

$ErrorActionPreference = 'Stop'
$agentDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $agentDirectory 'agent.config.json'
$examplePath = Join-Path $agentDirectory 'agent.config.example.json'
$launcherPath = Join-Path $agentDirectory 'iniciar-agente.cmd'
$executablePath = Join-Path $agentDirectory 'MoliCellThermalPrintAgent.exe'

if (-not (Test-Path $executablePath) -and -not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'No se encontró MoliCellThermalPrintAgent.exe ni Node.js LTS. Copiá el agente completo o instalá Node.js.'
}

$config = if (Test-Path $configPath) {
  Get-Content $configPath -Raw | ConvertFrom-Json
} else {
  Get-Content $examplePath -Raw | ConvertFrom-Json
}

$config.allowedOrigins = @($Origin)
if ($PrinterName) { $config.printerName = $PrinterName }
$config | ConvertTo-Json -Depth 3 | Set-Content $configPath -Encoding utf8

$taskName = 'MoliCell Thermal Print Agent'
$taskAction = if (Test-Path $executablePath) { "`"$executablePath`"" } else { "cmd.exe /c `"`"$launcherPath`"`"" }
schtasks.exe /Create /TN $taskName /TR $taskAction /SC ONLOGON /F | Out-Null
schtasks.exe /Run /TN $taskName | Out-Null

Write-Host "Agente instalado. Se iniciará automáticamente al ingresar a Windows y aceptará impresiones desde $Origin."
