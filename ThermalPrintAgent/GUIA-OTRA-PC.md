# Instalar impresión térmica en otra PC

Esta opción usa el ejecutable `MoliCellThermalPrintAgent.exe`, por lo que la PC de caja no necesita tener Node.js. La configuración se realiza una vez por PC; después la persona de caja sólo abre MoliCell e imprime.

## Antes de empezar

- Tener la impresora POS-58 conectada por USB y con papel.
- Tener permisos para instalar software en la PC.
- Saber el nombre que Windows muestra para la impresora, por ejemplo `POS-58`.
- Copiar la carpeta `ThermalPrintAgent` completa a una ruta permanente, por ejemplo `C:\MoliCell\ThermalPrintAgent`. No copiarla al Escritorio ni a Descargas. Debe incluir `MoliCellThermalPrintAgent.exe`.

## Instalación única

1. Instalá el controlador de la POS-58. Confirmá en **Configuración > Impresoras y escáneres** que aparezca disponible y anotá su nombre exacto.
2. Abrí PowerShell dentro de `C:\MoliCell\ThermalPrintAgent`.
4. Ejecutá el siguiente comando, reemplazando sólo el nombre de la impresora si fuera distinto:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\instalar-agente.ps1 -Origin "https://molicell.store" -PrinterName "POS-58"
   ```

   El permiso `Bypass` aplica sólo a esta ejecución; no cambia de forma permanente la política de PowerShell de la PC.
5. Verificá que el agente esté activo:

   ```powershell
   .\verificar-agente.ps1
   ```

6. Abrí `https://molicell.store`, iniciá sesión, generá un ticket de prueba y pulsá **Imprimir**. No debe aparecer el diálogo de Chrome.

## Uso diario

El instalador deja un acceso directo del agente en la carpeta Inicio del usuario de Windows y lo inicia en el momento. La persona de caja sólo tiene que encender/conectar la POS-58, abrir MoliCell y pulsar **Imprimir**.

Si Windows cambió el nombre de la impresora o se instala una segunda térmica, editá `agent.config.json`, ajustá `printerName` y ejecutá nuevamente el comando de instalación.

## Cambiar el dominio publicado

Cuando la URL definitiva sea distinta, ejecutá una vez:

```powershell
.\configurar-url.ps1 -Origin "https://tu-nuevo-dominio.com"
```

El comando actualiza la configuración y reinicia el agente. No hace falta volver a instalar la impresora, Node.js ni la tarea automática.

## Si Avast bloquea algo

Si Avast bloquea el ejecutable, no lo desactives de forma general. La persona que administra la PC debe restaurar únicamente este archivo descargado desde el repositorio de MoliCell y, si es necesario, permitir una excepción sólo para `C:\MoliCell\ThermalPrintAgent`.

Si el problema persiste, ejecutá `verificar-agente.ps1` y guardá el mensaje mostrado antes de intentar imprimir nuevamente.
