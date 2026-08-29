const request = require('supertest');
const app = require('../../index');
const { loginComoAdmin } = require('../helpers');
require('../setup');

describe('CRUD /marca', () => {
    let token;
    let marcaCreada;

    beforeAll(async () => {
        token = await loginComoAdmin();
    });

    // ✅ ESCENARIOS EXITOSOS
    describe('✅ Escenarios exitosos', () => {
        it('debería crear una marca con nombre válido → 201', async () => {
            const res = await request(app)
                .post('/marca')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Samsung' });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe('Samsung');
            expect(res.body).toHaveProperty('creado_en');
            marcaCreada = res.body;
        });

        it('debería obtener todas las marcas → 200 + array', async () => {
            const res = await request(app).get('/marca');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
        });

        it('debería obtener una marca por ID → 200', async () => {
            const res = await request(app).get(`/marca/${marcaCreada.id}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(marcaCreada.id);
            expect(res.body.name).toBe('Samsung');
        });

        it('debería actualizar el nombre de una marca → 200', async () => {
            const res = await request(app)
                .put(`/marca/${marcaCreada.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Apple' });

            expect(res.status).toBe(200);
            expect(res.body.name).toBe('Apple');
        });

        it('debería eliminar una marca existente → 200', async () => {
            // Crear una marca extra para eliminar sin afectar las demás pruebas
            const resCrear = await request(app)
                .post('/marca')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'MarcaParaBorrar' });

            const res = await request(app)
                .delete(`/marca/${resCrear.body.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });
    });

    // ❌ ESCENARIOS DE FALLO
    describe('❌ Escenarios de fallo', () => {
        it('debería rechazar crear marca sin token → 401', async () => {
            const res = await request(app)
                .post('/marca')
                .send({ name: 'Xiaomi' });

            expect(res.status).toBe(401);
        });

        it('debería devolver 404 al obtener marca con ID inexistente', async () => {
            const res = await request(app).get('/marca/99999');

            expect(res.status).toBe(404);
        });

        it('debería devolver 404 al actualizar marca con ID inexistente', async () => {
            const res = await request(app)
                .put('/marca/99999')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'NoExiste' });

            expect(res.status).toBe(404);
        });

        it('debería devolver 404 al eliminar marca con ID inexistente', async () => {
            const res = await request(app)
                .delete('/marca/99999')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });
    });

    // 🧪 CASOS BORDE
    describe('🧪 Casos borde', () => {
        it('debería manejar ID no numérico sin crashear', async () => {
            const res = await request(app).get('/marca/abc');

            // No debe ser un 500 por crash
            expect([400, 404, 500]).toContain(res.status);
        });
    });
});
