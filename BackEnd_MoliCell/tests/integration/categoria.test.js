const request = require('supertest');
const app = require('../../index');
const { loginComoAdmin } = require('../helpers');
require('../setup');

describe('CRUD /categoria', () => {
    let token;
    let categoriaCreada;

    beforeAll(async () => {
        token = await loginComoAdmin();
    });

    // ✅ ESCENARIOS EXITOSOS
    describe('✅ Escenarios exitosos', () => {
        it('debería crear una categoría → 201', async () => {
            const res = await request(app)
                .post('/categoria')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Celulares' });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe('Celulares');
            categoriaCreada = res.body;
        });

        it('debería listar categorías → 200 + array', async () => {
            const res = await request(app).get('/categoria');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
        });

        it('debería obtener categoría por ID → 200', async () => {
            const res = await request(app).get(`/categoria/${categoriaCreada.id}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(categoriaCreada.id);
            expect(res.body.name).toBe('Celulares');
        });

        it('debería actualizar categoría → 200', async () => {
            const res = await request(app)
                .put(`/categoria/${categoriaCreada.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Accesorios' });

            expect(res.status).toBe(200);
            expect(res.body.name).toBe('Accesorios');
        });

        it('debería eliminar categoría → 200', async () => {
            const resCrear = await request(app)
                .post('/categoria')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'CategoriaParaBorrar' });

            const res = await request(app)
                .delete(`/categoria/${resCrear.body.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });
    });

    // ❌ ESCENARIOS DE FALLO
    describe('❌ Escenarios de fallo', () => {
        it('debería rechazar crear categoría sin token → 401', async () => {
            const res = await request(app)
                .post('/categoria')
                .send({ name: 'Cables' });

            expect(res.status).toBe(401);
        });

        it('debería devolver 404 al obtener categoría inexistente', async () => {
            const res = await request(app).get('/categoria/99999');

            expect(res.status).toBe(404);
        });

        it('debería devolver 404 al actualizar categoría inexistente', async () => {
            const res = await request(app)
                .put('/categoria/99999')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'NoExiste' });

            expect(res.status).toBe(404);
        });

        it('debería rechazar eliminar categoría con productos asignados → 400', async () => {
            // Crear marca y categoría
            const resMarca = await request(app)
                .post('/marca')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'MarcaTestCat' });

            const resCat = await request(app)
                .post('/categoria')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'ConProducto' });

            // Crear producto asociado a esta categoría
            const resProd = await request(app)
                .post('/producto')
                .set('Authorization', `Bearer ${token}`)
                .field('name', 'Celular Test Cat')
                .field('precio', 15000)
                .field('marca_id', resMarca.body.id)
                .field('categorias', JSON.stringify([resCat.body.id]));

            expect(resProd.status).toBe(201);

            // Intentar borrar la categoría
            const resDel = await request(app)
                .delete(`/categoria/${resCat.body.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(resDel.status).toBe(400);
            expect(resDel.body.error).toContain('No se puede eliminar la categoría porque hay');
        });

        it('debería devolver 404 al eliminar categoría inexistente', async () => {
            const res = await request(app)
                .delete('/categoria/99999')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });
    });
});
