param(
  [string]$Origin = 'https://molicell.store',
  [string]$PrinterName = ''
)

$ErrorActionPreference = 'Stop'
$agentDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $agentDirectory 'agent.config.json'
$examplePath = Join-Path $agentDirectory 'agent.config.example.json'
$launcherPath = Join-Path $agentDirectory 'iniciar-agente.cmd'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js LTS no está instalado. Instalalo y ejecutá nuevamente este instalador.'
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
$taskAction = "cmd.exe /c `"`"$launcherPath`"`""
schtasks.exe /Create /TN $taskName /TR $taskAction /SC ONLOGON /F | Out-Null
schtasks.exe /Run /TN $taskName | Out-Null

Write-Host "Agente instalado. Se iniciará automáticamente al ingresar a Windows y aceptará impresiones desde $Origin."
