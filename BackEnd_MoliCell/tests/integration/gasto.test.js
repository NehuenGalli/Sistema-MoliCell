const request = require('supertest');
const app = require('../../index');
const { loginComoAdmin } = require('../helpers');

describe('CRUD /gasto', () => {
    let token;
    let gasto;

    beforeAll(async () => { token = await loginComoAdmin(); });

    test('protege todas las operaciones', async () => {
        expect((await request(app).get('/gasto')).status).toBe(401);
        expect((await request(app).post('/gasto').send({})).status).toBe(401);
    });

    test('crea un gasto con datos normalizados', async () => {
        const response = await request(app).post('/gasto').set('Authorization', `Bearer ${token}`).send({
            categoria: 'Proveedor', descripcion: 'Compra de repuestos', monto: 12500.55,
            fecha: '2026-09-20', proveedor: 'Distribuidora Norte', comprobante: 'A-102', notas: 'Pantallas'
        });
        expect(response.status).toBe(201);
        expect(response.body.data).toMatchObject({ categoria: 'Proveedor', monto: 12500.55, descripcion: 'Compra de repuestos' });
        gasto = response.body.data;
    });

    test('rechaza montos, categorías y campos inválidos', async () => {
        const response = await request(app).post('/gasto').set('Authorization', `Bearer ${token}`).send({
            categoria: 'Hack', descripcion: '', monto: -1, fecha: 'no-fecha'
        });
        expect(response.status).toBe(400);
    });

    test('lista por mes con resumen, búsqueda y paginación', async () => {
        const response = await request(app).get('/gasto?periodo=mes&mes=2026-09&search=repuestos&limit=10').set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.gastos).toHaveLength(1);
        expect(response.body.resumen).toMatchObject({ total_monto: 12500.55, cantidad: 1, desde: '2026-09-01', hasta: '2026-09-30' });
        expect(response.body.pagination).toMatchObject({ totalItems: 1, currentPage: 1, limit: 10 });
    });

    test('actualiza un gasto y valida el ID', async () => {
        const response = await request(app).patch(`/gasto/${gasto.id}`).set('Authorization', `Bearer ${token}`).send({ monto: 13000, categoria: 'Factura' });
        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({ monto: 13000, categoria: 'Factura' });
        expect((await request(app).patch('/gasto/abc').set('Authorization', `Bearer ${token}`).send({ monto: 1 })).status).toBe(400);
    });

    test('elimina y devuelve 404 para recursos inexistentes', async () => {
        expect((await request(app).delete(`/gasto/${gasto.id}`).set('Authorization', `Bearer ${token}`)).status).toBe(200);
        expect((await request(app).delete(`/gasto/${gasto.id}`).set('Authorization', `Bearer ${token}`)).status).toBe(404);
    });
});
