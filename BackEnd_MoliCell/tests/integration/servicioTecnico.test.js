const request = require('supertest');
const app = require('../../index');
const { loginComoAdmin, crearServicioAux } = require('../helpers');
require('../setup');

describe('CRUD /tecnico — Servicio Técnico', () => {
    let token;
    let servicioCreado;

    beforeAll(async () => {
        token = await loginComoAdmin();
    });

    // ESCENARIOS EXITOSOS
    describe('Escenarios exitosos', () => {
        it('debería crear servicio técnico con datos válidos → 201', async () => {
            const res = await request(app)
                .post('/tecnico')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    cliente_nombre: 'Juan Pérez',
                    cliente_telefono: '1155667788',
                    dispositivo: 'Samsung Galaxy S23',
                    falla_descripcion: 'Pantalla rota',
                    presupuesto_estimado: 15000
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('codigo_seguimiento');
            expect(res.body.codigo_seguimiento).toMatch(/^MC-[A-F0-9]{6}$/);
            expect(res.body.estado).toBe('Pendiente');
            expect(res.body.dispositivo).toBe('Samsung Galaxy S23');
            servicioCreado = res.body;
        });

        it('debería listar todos los servicios técnicos (admin) → 200', async () => {
            const res = await request(app)
                .get('/tecnico')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.servicios)).toBe(true);
            expect(res.body.servicios.length).toBeGreaterThanOrEqual(1);
            expect(res.body.pagination).toEqual(expect.objectContaining({
                totalItems: expect.any(Number),
                currentPage: 1
            }));
        });

        it('debería obtener servicio técnico por ID (admin) → 200 + incluye datos del cliente', async () => {
            const res = await request(app)
                .get(`/tecnico/${servicioCreado.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(servicioCreado.id);
            expect(res.body).toHaveProperty('cliente_nombre');
            expect(res.body).toHaveProperty('cliente_telefono');
        });

        it('debería consultar por código de seguimiento (pública) → 200 + DTO público', async () => {
            const res = await request(app)
                .get(`/tecnico/seguimiento/${servicioCreado.codigo_seguimiento}`);

            expect(res.status).toBe(200);
            // El DTO público NO debe incluir datos del cliente
            expect(res.body).not.toHaveProperty('cliente_nombre');
            expect(res.body).not.toHaveProperty('cliente_telefono');
            // SÍ debe incluir los datos del dispositivo
            expect(res.body).toHaveProperty('dispositivo');
            expect(res.body).toHaveProperty('falla_descripcion');
            expect(res.body).toHaveProperty('estado');
            expect(res.body).toHaveProperty('codigo_seguimiento');
        });

        it('debería actualizar estado a "En Proceso" → 200', async () => {
            const res = await request(app)
                .put(`/tecnico/${servicioCreado.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ id: servicioCreado.id, estado: 'En Proceso' });

            expect(res.status).toBe(200);
            expect(res.body.estado).toBe('En Proceso');
        });

        it('debería actualizar estado a "Listo" → 200', async () => {
            const res = await request(app)
                .put(`/tecnico/${servicioCreado.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ id: servicioCreado.id, estado: 'Listo' });

            expect(res.status).toBe(200);
            expect(res.body.estado).toBe('Listo');
        });

        it('debería actualizar estado a "Entregado" → 200', async () => {
            const res = await request(app)
                .put(`/tecnico/${servicioCreado.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ id: servicioCreado.id, estado: 'Entregado' });

            expect(res.status).toBe(200);
            expect(res.body.estado).toBe('Entregado');
        });

        it('debería eliminar servicio técnico → 200', async () => {
            const servicio = await crearServicioAux(token);

            const res = await request(app)
                .delete(`/tecnico/${servicio.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });
    });

    // ESCENARIOS DE FALLO — ENUM de estados
    describe('Validación de ENUM de estados', () => {
        it('debería rechazar estado "Reparado" (no existe) → 400', async () => {
            const servicio = await crearServicioAux(token);

            const res = await request(app)
                .put(`/tecnico/${servicio.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ id: servicio.id, estado: 'Reparado' });

            expect(res.status).toBe(400);
        });

        it('debería rechazar estado "Casi Listo" → 400', async () => {
            const servicio = await crearServicioAux(token);

            const res = await request(app)
                .put(`/tecnico/${servicio.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ id: servicio.id, estado: 'Casi Listo' });

            expect(res.status).toBe(400);
        });

        it('debería rechazar estado vacío "" → 400', async () => {
            const servicio = await crearServicioAux(token);

            const res = await request(app)
                .put(`/tecnico/${servicio.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ id: servicio.id, estado: '' });

            expect(res.status).toBe(400);
        });

        it('debería rechazar estado "Cancelado" → 400', async () => {
            const servicio = await crearServicioAux(token);

            const res = await request(app)
                .put(`/tecnico/${servicio.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ id: servicio.id, estado: 'Cancelado' });

            expect(res.status).toBe(400);
        });
    });

    // ESCENARIOS DE FALLO — Campos obligatorios
    describe('Validación de campos', () => {
        it('debería rechazar servicio sin dispositivo → 400', async () => {
            const res = await request(app)
                .post('/tecnico')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    cliente_nombre: 'Test',
                    falla_descripcion: 'Test',
                    presupuesto_estimado: 1000
                });

            expect(res.status).toBe(400);
        });

        it('debería rechazar servicio sin falla_descripcion → 400', async () => {
            const res = await request(app)
                .post('/tecnico')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    cliente_nombre: 'Test',
                    dispositivo: 'Test',
                    presupuesto_estimado: 1000
                });

            expect(res.status).toBe(400);
        });

        it('debería rechazar servicio sin presupuesto_estimado → 400', async () => {
            const res = await request(app)
                .post('/tecnico')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    cliente_nombre: 'Test',
                    dispositivo: 'Test',
                    falla_descripcion: 'Test'
                });

            expect(res.status).toBe(400);
        });

        it('debería rechazar servicio con presupuesto negativo → 400', async () => {
            const res = await request(app)
                .post('/tecnico')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    cliente_nombre: 'Test',
                    dispositivo: 'Test',
                    falla_descripcion: 'Test',
                    presupuesto_estimado: -500
                });

            expect(res.status).toBe(400);
        });

        it('debería aceptar presupuesto inicial en cero → 201', async () => {
            const res = await request(app)
                .post('/tecnico')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    cliente_nombre: 'Sin diagnóstico',
                    dispositivo: 'Moto G',
                    falla_descripcion: 'A revisar',
                    presupuesto_estimado: 0
                });

            expect(res.status).toBe(201);
            expect(Number(res.body.presupuesto_estimado)).toBe(0);
        });
    });

    // SEGURIDAD
    describe('Seguridad', () => {
        it('debería rechazar crear servicio sin token → 401', async () => {
            const res = await request(app).post('/tecnico').send({
                cliente_nombre: 'Test',
                dispositivo: 'Test',
                falla_descripcion: 'Test',
                presupuesto_estimado: 1000
            });

            expect(res.status).toBe(401);
        });

        it('debería rechazar listar servicios sin token → 401', async () => {
            const res = await request(app).get('/tecnico');
            expect(res.status).toBe(401);
        });

        it('debería rechazar obtener servicio por ID sin token → 401', async () => {
            const res = await request(app).get(`/tecnico/${servicioCreado.id}`);
            expect(res.status).toBe(401);
        });

        it('debería rechazar actualizar servicio sin token → 401', async () => {
            const res = await request(app)
                .put(`/tecnico/${servicioCreado.id}`)
                .send({ id: servicioCreado.id, estado: 'Listo' });

            expect(res.status).toBe(401);
        });

        it('debería rechazar eliminar servicio sin token → 401', async () => {
            const res = await request(app).delete(`/tecnico/${servicioCreado.id}`);
            expect(res.status).toBe(401);
        });

        it('debería permitir consulta pública por código SIN token → 200', async () => {
            const res = await request(app)
                .get(`/tecnico/seguimiento/${servicioCreado.codigo_seguimiento}`);

            expect(res.status).toBe(200);
        });
    });

    // CASOS BORDE
    describe('Casos borde', () => {
        it('debería devolver 404 con código de seguimiento inexistente', async () => {
            const res = await request(app).get('/tecnico/seguimiento/MC-ZZZZZZ');

            expect(res.status).toBe(404);
        });

        it('debería funcionar con código en minúsculas (case-insensitive)', async () => {
            const codigoMinusculas = servicioCreado.codigo_seguimiento.toLowerCase();
            const res = await request(app).get(`/tecnico/seguimiento/${codigoMinusculas}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('dispositivo');
        });

        it('debería devolver 404 al obtener servicio con ID inexistente', async () => {
            const res = await request(app)
                .get('/tecnico/99999')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });

        it('debería devolver 404 al eliminar servicio con ID inexistente', async () => {
            const res = await request(app)
                .delete('/tecnico/99999')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });

        it('debería devolver 404 al actualizar servicio con ID inexistente', async () => {
            const res = await request(app)
                .put('/tecnico/99999')
                .set('Authorization', `Bearer ${token}`)
                .send({ id: 99999, estado: 'Listo' });

            expect(res.status).toBe(404);
        });
    });
});
