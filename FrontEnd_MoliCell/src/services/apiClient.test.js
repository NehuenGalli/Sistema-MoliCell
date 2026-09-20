import MockAdapter from 'axios-mock-adapter';
import { beforeEach, describe, expect, it } from 'vitest';
import apiClient, { cachedGet, invalidateGetCache } from './apiClient';

describe('apiClient', () => {
  let mock;

  beforeEach(() => {
    invalidateGetCache();
    mock = new MockAdapter(apiClient);
  });

  it('deduplica GET simultáneos y normaliza el orden de parámetros', async () => {
    mock.onGet('/items').reply(200, { ok: true });

    const [first, second] = await Promise.all([
      cachedGet('/items', { params: { b: 2, a: 1 } }),
      cachedGet('/items', { params: { a: 1, b: 2 } }),
    ]);

    expect(first).toEqual({ ok: true });
    expect(second).toEqual({ ok: true });
    expect(mock.history.get).toHaveLength(1);
  });

  it('invalida entradas por prefijo', async () => {
    mock.onGet('/items').reply(200, { ok: true });
    await cachedGet('/items');
    invalidateGetCache('/items');
    await cachedGet('/items');
    expect(mock.history.get).toHaveLength(2);
  });

  it('adjunta CSRF solamente a métodos mutables', async () => {
    sessionStorage.setItem('molicell_csrf_token', 'csrf-test');
    mock.onPost('/write').reply((config) => [200, { csrf: config.headers['X-CSRF-Token'] }]);
    mock.onGet('/read').reply((config) => [200, { csrf: config.headers['X-CSRF-Token'] }]);

    await expect(apiClient.post('/write', {})).resolves.toEqual({ csrf: 'csrf-test' });
    await expect(apiClient.get('/read')).resolves.toEqual({});
  });

  it('convierte errores de API en mensajes seguros para la UI', async () => {
    mock.onGet('/fail').reply(422, { error: 'Dato inválido' });
    await expect(apiClient.get('/fail')).rejects.toThrow('Dato inválido');
  });
});
