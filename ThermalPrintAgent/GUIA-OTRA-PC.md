# Instalar impresión térmica en otra PC

Esta opción es gratuita: usa Node.js y no instala el ejecutable empaquetado que Avast puede marcar. La configuración se realiza una vez por PC; después la persona de caja sólo abre MoliCell e imprime.

## Antes de empezar

- Tener la impresora POS-58 conectada por USB y con papel.
- Tener permisos para instalar software en la PC.
- Saber el nombre que Windows muestra para la impresora, por ejemplo `POS-58`.
- Copiar los archivos de la carpeta `ThermalPrintAgent` a una ruta permanente, por ejemplo `C:\MoliCell\ThermalPrintAgent`. No copiarla al Escritorio ni a Descargas. No copiar `MoliCellThermalPrintAgent.exe` ni `node_modules`: esta guía usa exclusivamente la versión gratuita con Node.js.

## Instalación única

1. Instalá la versión LTS de Node.js desde su sitio oficial. Al finalizar, reiniciá la terminal si estaba abierta.
2. Instalá el controlador de la POS-58. Confirmá en **Configuración > Impresoras y escáneres** que aparezca disponible y anotá su nombre exacto.
3. Abrí PowerShell dentro de `C:\MoliCell\ThermalPrintAgent`.
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

El agente se inicia automáticamente al iniciar sesión en Windows. La persona de caja sólo tiene que encender/conectar la POS-58, abrir MoliCell y pulsar **Imprimir**.

Si Windows cambió el nombre de la impresora o se instala una segunda térmica, editá `agent.config.json`, ajustá `printerName` y ejecutá nuevamente el comando de instalación.

## Cambiar el dominio publicado

Cuando la URL definitiva sea distinta, ejecutá una vez:

```powershell
.\configurar-url.ps1 -Origin "https://tu-nuevo-dominio.com"
```

El comando actualiza la configuración y reinicia el agente. No hace falta volver a instalar la impresora, Node.js ni la tarea automática.

## Si Avast bloquea algo

No desactives Avast. Esta versión ejecuta `node.exe` con los archivos de la carpeta de MoliCell, en lugar de usar el ejecutable empaquetado. Si Avast bloquea `node.exe` o esos archivos, la excepción debe hacerse una única vez para la carpeta `C:\MoliCell\ThermalPrintAgent` por la persona que administra esa PC.

Si el problema persiste, ejecutá `verificar-agente.ps1` y guardá el mensaje mostrado antes de intentar imprimir nuevamente.
