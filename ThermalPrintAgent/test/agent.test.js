const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { after, before, describe, it } = require('node:test');
const {
  choosePrinter,
  consumePrintRateLimit,
  createAgentServer,
  createEscPosDocument,
  isAllowedOrigin,
  loadConfig,
  pruneRecentPrints,
  readJson,
} = require('../agent');

describe('funciones puras del agente', () => {
  it('elige impresora configurada, térmica o predeterminada', () => {
    const printers = [
      { Name: 'Office', Default: true, WorkOffline: false, DriverName: 'Laser' },
      { Name: 'POS-58', Default: false, WorkOffline: false, DriverName: 'Thermal' },
      { Name: 'Offline', Default: false, WorkOffline: true, DriverName: 'POS' },
    ];
    assert.equal(choosePrinter(printers, 'Office'), 'Office');
    assert.equal(choosePrinter(printers), 'POS-58');
    assert.throws(() => choosePrinter(printers, 'Missing'), /no está disponible/);
    assert.equal(choosePrinter([printers[0]]), 'Office');
    assert.throws(() => choosePrinter([{ ...printers[0], Default: false }]), /No se encontró/);
  });

  it('normaliza texto y genera comandos ESC/POS', () => {
    const result = createEscPosDocument('  Teléfono ñ\r\nTotal: $100  ');
    assert.equal(Buffer.isBuffer(result), true);
    assert.match(result.toString('ascii'), /Telefono n\nTotal: \$100/);
    assert.deepEqual([...result.subarray(0, 2)], [0x1b, 0x40]);
  });

  it('limita frecuencia y poda huellas vencidas sin memoria creciente', () => {
    const attempts = [];
    for (let index = 0; index < 20; index += 1) assert.equal(consumePrintRateLimit(1000, attempts), true);
    assert.equal(consumePrintRateLimit(1000, attempts), false);
    assert.equal(consumePrintRateLimit(62000, attempts), true);

    const prints = new Map([['old', 0], ['new', 9000]]);
    pruneRecentPrints(10000, prints);
    assert.deepEqual([...prints.keys()], ['new']);
  });

  it('carga valores predeterminados y valida orígenes', () => {
    const loaded = loadConfig();
    assert.equal(loaded.port, 17858);
    assert.equal(isAllowedOrigin('https://molicell.store'), true);
    assert.equal(isAllowedOrigin('https://evil.example'), false);
  });

  it('lee JSON válido y rechaza formato o tamaño inválidos', async () => {
    await assert.doesNotReject(async () => {
      const result = await readJson(Readable.from(['{"ok":true}']));
      assert.deepEqual(result, { ok: true });
    });
    await assert.rejects(readJson(Readable.from(['{bad'])), /formato/);
    await assert.rejects(readJson(Readable.from(['x'.repeat(33 * 1024)])), /excede/);
  });
});

describe('servidor HTTP local', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = createAgentServer();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it('responde health sólo a un origen autorizado', async () => {
    const allowed = await fetch(`${baseUrl}/health`, { headers: { Origin: 'https://molicell.store' } });
    assert.equal(allowed.status, 200);
    assert.equal((await allowed.json()).ok, true);

    const denied = await fetch(`${baseUrl}/health`, { headers: { Origin: 'https://evil.example' } });
    assert.equal(denied.status, 403);
  });

  it('maneja preflight, rutas y payloads inválidos', async () => {
    const preflight = await fetch(`${baseUrl}/print`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://molicell.store' },
    });
    assert.equal(preflight.status, 204);

    const missing = await fetch(`${baseUrl}/missing`, { headers: { Origin: 'https://molicell.store' } });
    assert.equal(missing.status, 404);

    const wrongType = await fetch(`${baseUrl}/print`, {
      method: 'POST',
      headers: { Origin: 'https://molicell.store', 'Content-Type': 'text/plain' },
      body: 'ticket',
    });
    assert.equal(wrongType.status, 415);

    const empty = await fetch(`${baseUrl}/print`, {
      method: 'POST',
      headers: { Origin: 'https://molicell.store', 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(empty.status, 400);
  });
});
