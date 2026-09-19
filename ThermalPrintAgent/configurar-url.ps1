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
$taskName = 'MoliCell Thermal Print Agent'
schtasks.exe /End /TN $taskName 2>$null | Out-Null
schtasks.exe /Run /TN $taskName | Out-Null

Write-Host "URL actualizada. El agente ahora acepta impresiones desde $Origin."
