const request = require('supertest');
const app = require('../../index');
const pool = require('../../src/config/db');
const { loginComoAdmin, crearMarcaAux, crearProductoAux, crearServicioAux } = require('../helpers');

describe('detalle de /ganancia', () => {
    const fecha = '2032-04-15';
    let token;

    beforeAll(async () => {
        token = await loginComoAdmin();
        const marca = await crearMarcaAux(token, 'Marca Ganancias');
        const producto = await crearProductoAux(token, marca.id, {
            name: 'Producto Ganancias', precio: 1000, precio_costo: 400, stock: 5
        });

        const venta = await request(app).post('/venta').set('Authorization', `Bearer ${token}`).send({
            metodo_pago: 'Efectivo', productos: [{ producto_id: producto.id, cantidad: 1 }]
        });
        await pool.query('UPDATE venta SET fecha = $1 WHERE id = $2', [fecha, venta.body.data.id]);

        await request(app).post('/gasto').set('Authorization', `Bearer ${token}`).send({
            categoria: 'Proveedor', descripcion: 'Insumo del período', monto: 100, fecha
        });

        const deuda = await request(app).post('/deuda').set('Authorization', `Bearer ${token}`).send({
            persona_nombre: 'Cliente a cobrar', concepto: 'Saldo de venta', origen: 'Venta',
            referencia: venta.body.data.codigo_venta, monto_total: 300, fecha
        });
        await request(app).post(`/deuda/${deuda.body.data.id}/pagos`).set('Authorization', `Bearer ${token}`).send({
            monto: 100, fecha, notas: 'Pago parcial'
        });
    });

    test('protege el reporte y valida los rangos', async () => {
        expect((await request(app).get('/ganancia')).status).toBe(401);
        const invalid = await request(app)
            .get('/ganancia?periodo=personalizado&desde=2032-05-01&hasta=2032-04-01')
            .set('Authorization', `Bearer ${token}`);
        expect(invalid.status).toBe(400);
        expect(invalid.body.error).toMatch(/fecha desde/i);
    });

    test('no reconoce un servicio pendiente y lo suma una sola vez al estar listo', async () => {
        const servicio = await crearServicioAux(token, {
            cliente_nombre: 'Cliente Servicio', dispositivo: 'Equipo Ganancias',
            falla_descripcion: 'Reparación para el reporte', presupuesto_estimado: 2000
        });
        expect(servicio).toHaveProperty('id');

        const before = await request(app)
            .get(`/ganancia?periodo=dia&fecha=${fecha}`)
            .set('Authorization', `Bearer ${token}`);
        expect(before.status).toBe(200);
        expect(before.body.resumen.ingresos_servicios).toBe(0);

        const ready = await request(app).patch(`/tecnico/${servicio.id}`).set('Authorization', `Bearer ${token}`).send({ estado: 'Listo' });
        expect(ready.status).toBe(200);
        expect(ready.body.fecha_reconocimiento).toBeTruthy();
        await pool.query("UPDATE servicio_tecnico SET fecha_reconocimiento = ($1::date + INTERVAL '12 hours') WHERE id = $2", [fecha, servicio.id]);

        const delivered = await request(app).patch(`/tecnico/${servicio.id}`).set('Authorization', `Bearer ${token}`).send({ estado: 'Entregado' });
        expect(delivered.status).toBe(200);
        expect(String(delivered.body.fecha_reconocimiento).slice(0, 10)).toBe(fecha);
    });

    test('calcula la ganancia neta y entrega el origen de cada importe', async () => {
        const response = await request(app)
            .get(`/ganancia?periodo=dia&fecha=${fecha}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.resumen).toMatchObject({
            desde: fecha,
            hasta: fecha,
            periodo: 'dia',
            ingresos_ventas: 850,
            ingresos_servicios: 2000,
            cobros_deudas: 100,
            ingresos_totales: 2950,
            costo_productos: 400,
            gastos: 100,
            deudas_generadas: 300,
            egresos_totales: 800,
            ganancia_neta: 2150
        });
        expect(response.body.detalle.ventas).toHaveLength(1);
        expect(response.body.detalle.servicios).toHaveLength(1);
        expect(response.body.detalle.gastos).toHaveLength(1);
        expect(response.body.detalle.deudas).toHaveLength(1);
        expect(response.body.detalle.cobros).toHaveLength(1);
        expect(response.body.detalle.ventas[0]).toMatchObject({ monto: 850, costo_productos: 400 });
        expect(response.body.detalle.limite_por_seccion).toBe(200);
    });

    test('permite consultar períodos anteriores sin mezclar movimientos', async () => {
        const response = await request(app)
            .get('/ganancia?periodo=mes&mes=2032-03')
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.resumen).toMatchObject({ ingresos_totales: 0, egresos_totales: 0, ganancia_neta: 0 });
        expect(response.body.detalle.ventas).toEqual([]);
    });
});
