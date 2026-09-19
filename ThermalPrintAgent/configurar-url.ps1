param(
  [Parameter(Mandatory = $true)]
  [string]$Origin
)

$ErrorActionPreference = 'Stop'
$agentDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $agentDirectory 'agent.config.json'
$examplePath = Join-Path $agentDirectory 'agent.config.example.json'

$config = if (Test-Path $configPath) {
  Get-Content $configPath -Raw | ConvertFrom-Json
} else {
  Get-Content $examplePath -Raw | ConvertFrom-Json
}

$config.allowedOrigins = @($Origin)
$config | ConvertTo-Json -Depth 3 | Set-Content $configPath -Encoding utf8

# El agente lee la configuración al iniciar. Reiniciarlo hace efectivo el
# cambio sin que la persona de caja tenga que cerrar Windows.
$executablePath = Join-Path $agentDirectory 'MoliCellThermalPrintAgent.exe'
Get-Process -Name 'MoliCellThermalPrintAgent' -ErrorAction SilentlyContinue | Stop-Process -Force

if (Test-Path $executablePath) {
  Start-Process -FilePath $executablePath -WorkingDirectory $agentDirectory -WindowStyle Hidden
} elseif (Get-Command node -ErrorAction SilentlyContinue) {
  Start-Process -FilePath (Get-Command node).Source -ArgumentList 'agent.js' -WorkingDirectory $agentDirectory -WindowStyle Hidden
} else {
  throw 'No se encontró el ejecutable del agente ni Node.js para reiniciarlo.'
}

Write-Host "URL actualizada. El agente ahora acepta impresiones desde $Origin."
