$ErrorActionPreference = 'Stop'
$origin = 'https://molicell.store'

try {
  $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:17858/health' -Headers @{ Origin = $origin }
  if ($response.StatusCode -ne 200) { throw "El agente respondió con estado $($response.StatusCode)." }
  Write-Host 'Agente listo. Ahora abrí MoliCell y emití un ticket de prueba.' -ForegroundColor Green
} catch {
  Write-Host "El agente no responde: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host 'Verificá que Node.js esté instalado, que la tarea de MoliCell esté iniciada y que Avast no haya bloqueado node.exe.' -ForegroundColor Yellow
  exit 1
}
