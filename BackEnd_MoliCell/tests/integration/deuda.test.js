const request = require('supertest');
const app = require('../../index');
const { loginComoAdmin } = require('../helpers');

describe('gestión /deuda', () => {
    let token;
    let deudaId;
    let pagoId;
    beforeAll(async () => { token = await loginComoAdmin(); });

    test('requiere autenticación', async () => {
        expect((await request(app).get('/deuda')).status).toBe(401);
        expect((await request(app).post('/deuda').send({})).status).toBe(401);
    });

    test('crea una deuda detallada', async () => {
        const response = await request(app).post('/deuda').set('Authorization', `Bearer ${token}`).send({
            persona_nombre: 'María López', telefono: '1122334455', concepto: 'Venta de teléfono',
            origen: 'Venta', referencia: 'VEN-100', monto_total: 100000, fecha: '2026-09-15',
            vencimiento: '2026-10-01', notas: 'Pago en cuotas'
        });
        expect(response.status).toBe(201);
        expect(response.body.data).toMatchObject({ persona_nombre: 'María López', saldo_pendiente: 100000, estado: 'Pendiente' });
        deudaId = response.body.data.id;
    });

    test('valida datos y filtros', async () => {
        const invalid = await request(app).post('/deuda').set('Authorization', `Bearer ${token}`).send({ persona_nombre: 'A', monto_total: -1 });
        expect(invalid.status).toBe(400);
        expect((await request(app).get('/deuda?estado=hack').set('Authorization', `Bearer ${token}`)).status).toBe(400);
    });

    test('lista deudas activas con resumen', async () => {
        const response = await request(app).get('/deuda?estado=activas&search=maría').set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.deudas).toHaveLength(1);
        expect(response.body.resumen).toMatchObject({ cantidad: 1, total_original: 100000, total_cobrado: 0, total_pendiente: 100000 });
    });

    test('registra pago parcial y lo detalla', async () => {
        const payment = await request(app).post(`/deuda/${deudaId}/pagos`).set('Authorization', `Bearer ${token}`).send({ monto: 40000, fecha: '2026-09-20', notas: 'Primera cuota' });
        expect(payment.status).toBe(201);
        pagoId = payment.body.data.id;
        const detail = await request(app).get(`/deuda/${deudaId}`).set('Authorization', `Bearer ${token}`);
        expect(detail.body.data).toMatchObject({ monto_pagado: 40000, saldo_pendiente: 60000, estado: 'Parcial' });
        expect(detail.body.data.pagos).toHaveLength(1);
    });

    test('impide sobrepago y reducir el total debajo de lo cobrado', async () => {
        expect((await request(app).post(`/deuda/${deudaId}/pagos`).set('Authorization', `Bearer ${token}`).send({ monto: 70000, fecha: '2026-09-20' })).status).toBe(400);
        expect((await request(app).patch(`/deuda/${deudaId}`).set('Authorization', `Bearer ${token}`).send({ monto_total: 30000 })).status).toBe(400);
    });

    test('actualiza datos no financieros', async () => {
        const response = await request(app).patch(`/deuda/${deudaId}`).set('Authorization', `Bearer ${token}`).send({ telefono: '1199999999', concepto: 'Venta financiada' });
        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({ telefono: '1199999999', concepto: 'Venta financiada', estado: 'Parcial' });
    });

    test('elimina un pago y recalcula el estado', async () => {
        expect((await request(app).delete(`/deuda/${deudaId}/pagos/${pagoId}`).set('Authorization', `Bearer ${token}`)).status).toBe(200);
        const detail = await request(app).get(`/deuda/${deudaId}`).set('Authorization', `Bearer ${token}`);
        expect(detail.body.data).toMatchObject({ monto_pagado: 0, saldo_pendiente: 100000, estado: 'Pendiente' });
    });

    test('elimina la deuda y maneja IDs inexistentes', async () => {
        expect((await request(app).delete(`/deuda/${deudaId}`).set('Authorization', `Bearer ${token}`)).status).toBe(200);
        expect((await request(app).get(`/deuda/${deudaId}`).set('Authorization', `Bearer ${token}`)).status).toBe(404);
        expect((await request(app).get('/deuda/abc').set('Authorization', `Bearer ${token}`)).status).toBe(400);
    });
});
