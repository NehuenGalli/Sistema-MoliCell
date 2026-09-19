/*
 * Agente local de impresión térmica para Windows.
 * Envía bytes ESC/POS crudos al spooler, por lo que no abre el diálogo de Chrome
 * ni utiliza el tamaño fijo de hoja configurado en el controlador POS.
 */
const http = require('node:http');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { existsSync, readFileSync } = require('node:fs');
const { dirname, join } = require('node:path');
const { createHash } = require('node:crypto');

const execFileAsync = promisify(execFile);
// En el .exe de Windows, __dirname apunta al sistema virtual de pkg. Los
// archivos configurables deben vivir junto al ejecutable real.
const APP_DIRECTORY = process.pkg ? dirname(process.execPath) : __dirname;
const CONFIG_PATH = join(APP_DIRECTORY, 'agent.config.json');
const DEFAULT_CONFIG = {
  port: 17858,
  printerName: '',
  allowedOrigins: ['https://molicell.store', 'http://localhost:5173', 'http://127.0.0.1:5173'],
};

const config = loadConfig();
const PRINT_DEDUP_WINDOW_MS = 5000;
const activePrints = new Set();
const recentPrints = new Map();

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) return DEFAULT_CONFIG;

  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) };
  } catch (error) {
    console.warn(`No se pudo leer agent.config.json: ${error.message}. Se usarán los valores predeterminados.`);
    return DEFAULT_CONFIG;
  }
}

function isAllowedOrigin(origin) {
  return Boolean(origin) && config.allowedOrigins.includes(origin);
}

function setCorsHeaders(request, response) {
  const origin = request.headers.origin;
  if (!isAllowedOrigin(origin)) return false;

  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Vary', 'Origin');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Chrome solicita explícitamente este permiso cuando una web HTTPS se
  // comunica con el agente de la impresora en localhost.
  if (request.headers['access-control-request-private-network'] === 'true') {
    response.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  return true;
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 64 * 1024) {
        reject(new Error('El ticket excede el tamaño permitido.'));
        request.destroy();
      }
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('El formato del ticket no es válido.'));
      }
    });
    request.on('error', reject);
  });
}

async function listPrinters() {
  const command = 'Get-CimInstance Win32_Printer | Select-Object Name,Default,WorkOffline,DriverName | ConvertTo-Json -Compress';
  const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { windowsHide: true });
  const data = stdout.trim() ? JSON.parse(stdout) : [];
  return Array.isArray(data) ? data : [data];
}

function choosePrinter(printers, requestedPrinter) {
  const online = printers.filter((printer) => !printer.WorkOffline);
  const requested = requestedPrinter || config.printerName;
  if (requested) {
    const match = online.find((printer) => printer.Name === requested);
    if (match) return match.Name;
    throw new Error(`La impresora configurada "${requested}" no está disponible.`);
  }

  const thermal = online.find((printer) => /pos|term|thermal|ticket|58|xp-|epson|gadnic/i.test(`${printer.Name} ${printer.DriverName || ''}`));
  if (thermal) return thermal.Name;

  const defaultPrinter = online.find((printer) => printer.Default);
  if (defaultPrinter) return defaultPrinter.Name;

  throw new Error('No se encontró una impresora disponible. Conectá e instalá la POS-58 en Windows.');
}

function createEscPosDocument(text) {
  // Se elimina todo carácter fuera de CP437/ASCII para evitar símbolos corruptos
  // en controladores POS genéricos. La app ya entrega textos en español legibles.
  const safeText = String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E\r\n\t]/g, '')
    .replace(/\r\n?/g, '\n');

  return Buffer.concat([
    Buffer.from([0x1b, 0x40]), // Inicializar impresora
    Buffer.from([0x1b, 0x61, 0x00]), // Alineación a la izquierda
    Buffer.from(safeText.trimEnd() + '\n\n\n', 'ascii'),
    Buffer.from([0x1d, 0x56, 0x00]), // Corte completo (se ignora en modelos sin cortador)
  ]);
}

async function printRaw(printerName, data) {
  const printerBase64 = Buffer.from(printerName, 'utf8').toString('base64');
  const dataBase64 = data.toString('base64');
  const script = `
$source = @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
public static class MoliCellRawPrinter {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  private class DOCINFO { public string pDocName; public string pOutputFile; public string pDataType; }
  [DllImport("winspool.drv", SetLastError = true, CharSet = CharSet.Unicode)]
  private static extern bool OpenPrinter(string name, out IntPtr handle, IntPtr defaults);
  [DllImport("winspool.drv", SetLastError = true)] private static extern bool ClosePrinter(IntPtr handle);
  [DllImport("winspool.drv", SetLastError = true, CharSet = CharSet.Unicode)]
  private static extern int StartDocPrinter(IntPtr handle, int level, DOCINFO info);
  [DllImport("winspool.drv", SetLastError = true)] private static extern bool EndDocPrinter(IntPtr handle);
  [DllImport("winspool.drv", SetLastError = true)] private static extern bool StartPagePrinter(IntPtr handle);
  [DllImport("winspool.drv", SetLastError = true)] private static extern bool EndPagePrinter(IntPtr handle);
  [DllImport("winspool.drv", SetLastError = true)]
  private static extern bool WritePrinter(IntPtr handle, byte[] data, int count, out int written);
  private static void Check(bool value) { if (!value) throw new Win32Exception(Marshal.GetLastWin32Error()); }
  public static void Send(string printer, byte[] bytes) {
    IntPtr handle;
    Check(OpenPrinter(printer, out handle, IntPtr.Zero));
    try {
      var info = new DOCINFO { pDocName = "MoliCell Ticket", pDataType = "RAW" };
      if (StartDocPrinter(handle, 1, info) == 0) throw new Win32Exception(Marshal.GetLastWin32Error());
      try { Check(StartPagePrinter(handle)); try { int written; Check(WritePrinter(handle, bytes, bytes.Length, out written)); if (written != bytes.Length) throw new Exception("No se enviaron todos los datos a la impresora."); } finally { Check(EndPagePrinter(handle)); } }
      finally { Check(EndDocPrinter(handle)); }
    } finally { Check(ClosePrinter(handle)); }
  }
}
'@
Add-Type -TypeDefinition $source -Language CSharp
$printer = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${printerBase64}'))
$bytes = [Convert]::FromBase64String('${dataBase64}')
[MoliCellRawPrinter]::Send($printer, $bytes)
`;
  const encodedScript = Buffer.from(script, 'utf16le').toString('base64');
  await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encodedScript], { windowsHide: true });
}

const server = http.createServer(async (request, response) => {
  const corsAllowed = setCorsHeaders(request, response);
  if (request.method === 'OPTIONS') {
    response.writeHead(corsAllowed ? 204 : 403);
    response.end();
    return;
  }
  if (!corsAllowed) {
    sendJson(response, 403, { error: 'Origen no autorizado para impresión local.' });
    return;
  }

  try {
    if (request.method === 'GET' && request.url === '/health') {
      sendJson(response, 200, { ok: true, service: 'MoliCell Thermal Print Agent' });
      return;
    }
    if (request.method === 'GET' && request.url === '/printers') {
      const printers = await listPrinters();
      sendJson(response, 200, { printers });
      return;
    }
    if (request.method === 'POST' && request.url === '/print') {
      const { text, printerName } = await readJson(request);
      if (typeof text !== 'string' || !text.trim()) throw new Error('El ticket está vacío.');
      const printer = choosePrinter(await listPrinters(), printerName);
      const fingerprint = createHash('sha256').update(`${printer}\u0000${text}`).digest('hex');
      const now = Date.now();
      const previousPrint = recentPrints.get(fingerprint);

      // Defensa adicional: aunque el navegador reintente o se hagan varios
      // clics, el mismo ticket no entra a la cola dos veces en cinco segundos.
      if (activePrints.has(fingerprint) || (previousPrint && now - previousPrint < PRINT_DEDUP_WINDOW_MS)) {
        sendJson(response, 200, { ok: true, printer, duplicate: true });
        return;
      }

      activePrints.add(fingerprint);
      try {
        await printRaw(printer, createEscPosDocument(text));
        recentPrints.set(fingerprint, Date.now());
      } finally {
        activePrints.delete(fingerprint);
      }
      sendJson(response, 200, { ok: true, printer });
      return;
    }
    sendJson(response, 404, { error: 'Ruta no encontrada.' });
  } catch (error) {
    console.error('Error de impresión:', error.message);
    sendJson(response, 500, { error: error.message || 'No se pudo imprimir el ticket.' });
  }
});

server.listen(config.port, '127.0.0.1', () => {
  console.log(`MoliCell Thermal Print Agent listo en http://127.0.0.1:${config.port}`);
});
