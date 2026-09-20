const request = require('supertest');
const app = require('../../index');
const { loginComoAdmin, crearMarcaAux, crearProductoAux, crearServicioAux } = require('../helpers');
require('../setup');

describe('GET /dashboard/resumen', () => {
    it('consolida métricas en una sola respuesta acotada', async () => {
        const token = await loginComoAdmin();
        const marca = await crearMarcaAux(token, 'Dashboard');
        await crearProductoAux(token, marca.id, { name: 'Stock bajo', stock: 2 });
        await crearServicioAux(token, { dispositivo: 'Equipo dashboard' });

        const res = await request(app)
            .get('/dashboard/resumen')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.productos_activos).toBeGreaterThanOrEqual(1);
        expect(res.body.data.productos_stock_bajo).toBeGreaterThanOrEqual(1);
        expect(res.body.data.alertas_stock.length).toBeLessThanOrEqual(5);
        expect(res.body.data.reparaciones_recientes.length).toBeLessThanOrEqual(5);
        expect(res.body.data).toHaveProperty('ventas_totales');
    });

    it('requiere autenticación', async () => {
        expect((await request(app).get('/dashboard/resumen')).status).toBe(401);
    });
});
