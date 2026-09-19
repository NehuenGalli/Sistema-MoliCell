@echo off
cd /d "%~dp0"
if exist "%~dp0MoliCellThermalPrintAgent.exe" (
  "%~dp0MoliCellThermalPrintAgent.exe"
) else (
  node agent.js
)
