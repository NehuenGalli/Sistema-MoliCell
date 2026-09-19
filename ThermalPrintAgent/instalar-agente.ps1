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

$startupDirectory = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupDirectory 'MoliCell Thermal Print Agent.lnk'
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)

if (Test-Path $executablePath) {
  $shortcut.TargetPath = $executablePath
  $shortcut.Arguments = ''
} else {
  $shortcut.TargetPath = (Get-Command node).Source
  $shortcut.Arguments = "`"$agentDirectory\agent.js`""
}

$shortcut.WorkingDirectory = $agentDirectory
$shortcut.WindowStyle = 7 # Minimizada
$shortcut.Save()

# Iniciarlo ahora también permite probar sin cerrar sesión ni reiniciar Windows.
if (Test-Path $executablePath) {
  Start-Process -FilePath $executablePath -WorkingDirectory $agentDirectory -WindowStyle Hidden
} else {
  Start-Process -FilePath (Get-Command node).Source -ArgumentList 'agent.js' -WorkingDirectory $agentDirectory -WindowStyle Hidden
}

Write-Host "Agente instalado e iniciado. Se abrirá automáticamente al ingresar a Windows y aceptará impresiones desde $Origin."
