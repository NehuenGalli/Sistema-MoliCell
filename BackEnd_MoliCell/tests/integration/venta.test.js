const request = require('supertest');
const app = require('../../index');
const { loginComoAdmin, crearMarcaAux, crearProductoAux } = require('../helpers');
require('../setup');

describe('CRUD /venta', () => {
    let token;
    let marca;
    let producto1;
    let producto2;

    beforeAll(async () => {
        token = await loginComoAdmin();
        marca = await crearMarcaAux(token, 'MarcaVenta');
        producto1 = await crearProductoAux(token, marca.id, {
            name: 'Producto Venta 1',
            precio: 500,
            stock: 20
        });
        producto2 = await crearProductoAux(token, marca.id, {
            name: 'Producto Venta 2',
            precio: 200,
            stock: 10
        });
    });

    // ✅ ESCENARIOS EXITOSOS
    describe('✅ Escenarios exitosos', () => {
        let ventaCreada;

        it('debería crear venta con 1 producto → 201 + descuenta stock', async () => {
            const res = await request(app)
                .post('/venta')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    monto: 500,
                    metodo_pago: 'Efectivo',
                    productos: [{ producto_id: producto1.id, cantidad: 2 }]
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe('Venta agregada exitosamente');
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.monto).toBe(1000); // 2 × $500; ignora el monto manipulado del cliente
            ventaCreada = res.body.data;

            // Verificar que el stock se descontó
            const resProducto = await request(app).get(`/producto/${producto1.id}`);
            expect(resProducto.body.stock).toBe(18); // 20 - 2
        });

        it('debería crear venta con múltiples productos → 201', async () => {
            const res = await request(app)
                .post('/venta')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    monto: 900,
                    metodo_pago: 'Tarjeta',
                    productos: [
                        { producto_id: producto1.id, cantidad: 1 },
                        { producto_id: producto2.id, cantidad: 2 }
                    ]
                });

            expect(res.status).toBe(201);

            // Verificar descuento de stock de ambos
            const resP1 = await request(app).get(`/producto/${producto1.id}`);
            const resP2 = await request(app).get(`/producto/${producto2.id}`);
            expect(resP1.body.stock).toBe(17); // 18 - 1
            expect(resP2.body.stock).toBe(8);  // 10 - 2
        });

        it('debería listar ventas → 200 + array ordenado por fecha', async () => {
            const res = await request(app)
                .get('/venta')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThanOrEqual(2);
        });

        it('debería obtener venta por ID con detalle de productos → 200', async () => {
            const res = await request(app)
                .get(`/venta/${ventaCreada.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data).toHaveProperty('monto');
            expect(res.body.data).toHaveProperty('metodo_pago');
            expect(res.body.data).toHaveProperty('productos');
            expect(Array.isArray(res.body.data.productos)).toBe(true);
        });

        it('debería eliminar venta → 200 + restaurar stock', async () => {
            // Crear una venta dedicada para eliminar
            const resCrear = await request(app)
                .post('/venta')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    monto: 200,
                    metodo_pago: 'Transferencia',
                    productos: [{ producto_id: producto2.id, cantidad: 3 }]
                });

            const stockAntes = (await request(app).get(`/producto/${producto2.id}`)).body.stock;

            const res = await request(app)
                .delete(`/venta/${resCrear.body.data.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);

            // Verificar que el stock se restauró
            const stockDespues = (await request(app).get(`/producto/${producto2.id}`)).body.stock;
            expect(stockDespues).toBe(stockAntes + 3);
        });
    });

    // ❌ ESCENARIOS DE FALLO — Validación Joi
    describe('❌ Validación Joi', () => {
        it('debería calcular el monto en servidor aunque el cliente no lo envíe', async () => {
            const res = await request(app)
                .post('/venta')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    metodo_pago: 'Efectivo',
                    productos: [{ producto_id: producto1.id, cantidad: 1 }]
                });

            expect(res.status).toBe(201);
            expect(res.body.data.monto).toBe(500);
        });

        it('debería rechazar venta sin productos → 400', async () => {
            const res = await request(app)
                .post('/venta')
                .set('Authorization', `Bearer ${token}`)
                .send({ monto: 100, metodo_pago: 'Efectivo' });

            expect(res.status).toBe(400);
        });

        it('debería rechazar venta sin metodo_pago → 400', async () => {
            const res = await request(app)
                .post('/venta')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    monto: 100,
                    productos: [{ producto_id: producto1.id, cantidad: 1 }]
                });

            expect(res.status).toBe(400);
        });

        it('debería rechazar metodo_pago inválido "Bitcoin" → 400', async () => {
            const res = await request(app)
                .post('/venta')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    monto: 100,
                    metodo_pago: 'Bitcoin',
                    productos: [{ producto_id: producto1.id, cantidad: 1 }]
                });

            expect(res.status).toBe(400);
        });

        it('debería rechazar monto negativo → 400', async () => {
            const res = await request(app)
                .post('/venta')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    monto: -100,
                    metodo_pago: 'Efectivo',
                    productos: [{ producto_id: producto1.id, cantidad: 1 }]
                });

            expect(res.status).toBe(400);
        });

        it('debería rechazar producto con cantidad negativa → 400', async () => {
            const res = await request(app)
                .post('/venta')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    monto: 100,
                    metodo_pago: 'Efectivo',
                    productos: [{ producto_id: producto1.id, cantidad: -1 }]
                });

            expect(res.status).toBe(400);
        });

        it('debería rechazar producto con cantidad 0 → 400', async () => {
            const res = await request(app)
                .post('/venta')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    monto: 100,
                    metodo_pago: 'Efectivo',
                    productos: [{ producto_id: producto1.id, cantidad: 0 }]
                });

            expect(res.status).toBe(400);
        });

        it('debería rechazar productos duplicados para evitar descuentos ambiguos de stock', async () => {
            const res = await request(app)
                .post('/venta')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    monto: 1,
                    metodo_pago: 'Efectivo',
                    productos: [
                        { producto_id: producto1.id, cantidad: 1 },
                        { producto_id: producto1.id, cantidad: 1 }
                    ]
                });

            expect(res.status).toBe(400);
        });
    });

    // ❌ ESCENARIOS DE FALLO — Lógica de negocio / BD
    describe('❌ Lógica de negocio', () => {
        it('debería rechazar venta con producto_id inexistente → 404', async () => {
            const res = await request(app)
                .post('/venta')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    monto: 100,
                    metodo_pago: 'Efectivo',
                    productos: [{ producto_id: 99999, cantidad: 1 }]
                });

            expect(res.status).toBe(404);
        });

        it('debería rechazar venta cuando la cantidad excede el stock → 400', async () => {
            // Crear producto con stock bajo
            const productoConPoco = await crearProductoAux(token, marca.id, {
                name: 'Poco Stock',
                precio: 10,
                stock: 3
            });

            const res = await request(app)
                .post('/venta')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    monto: 50,
                    metodo_pago: 'Efectivo',
                    productos: [{ producto_id: productoConPoco.id, cantidad: 5 }]
                });

            expect(res.status).toBe(400);
        });
    });

    // 🔒 SEGURIDAD
    describe('🔒 Seguridad', () => {
        it('debería rechazar crear venta sin token → 401', async () => {
            const res = await request(app).post('/venta').send({
                monto: 100,
                metodo_pago: 'Efectivo',
                productos: [{ producto_id: producto1.id, cantidad: 1 }]
            });

            expect(res.status).toBe(401);
        });

        it('debería rechazar listar ventas sin token → 401', async () => {
            const res = await request(app).get('/venta');
            expect(res.status).toBe(401);
        });

        it('debería rechazar obtener venta por ID sin token → 401', async () => {
            const res = await request(app).get('/venta/1');
            expect(res.status).toBe(401);
        });

        it('debería rechazar eliminar venta sin token → 401', async () => {
            const res = await request(app).delete('/venta/1');
            expect(res.status).toBe(401);
        });
    });

    // 🧪 CASOS BORDE
    describe('🧪 Casos borde', () => {
        it('debería devolver 404 al obtener venta con ID inexistente', async () => {
            const res = await request(app)
                .get('/venta/99999')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });

        it('debería devolver 404 al eliminar venta con ID inexistente', async () => {
            const res = await request(app)
                .delete('/venta/99999')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });

        it('debería limitar la paginación a 100 elementos', async () => {
            const res = await request(app)
                .get('/venta?limit=9999')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.pagination.limit).toBe(100);
        });

        it('debería permitir venta con stock exacto (stock=5, cantidad=5) → 201 + stock queda en 0', async () => {
            const productoExacto = await crearProductoAux(token, marca.id, {
                name: 'Stock Exacto',
                precio: 10,
                stock: 5
            });

            const res = await request(app)
                .post('/venta')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    monto: 50,
                    metodo_pago: 'Efectivo',
                    productos: [{ producto_id: productoExacto.id, cantidad: 5 }]
                });

            expect(res.status).toBe(201);

            const resProducto = await request(app).get(`/producto/${productoExacto.id}`);
            expect(resProducto.body.stock).toBe(0);
        });
    });
});
