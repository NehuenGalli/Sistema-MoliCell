const request = require('supertest');
const app = require('../../index');
const { loginComoAdmin, crearMarcaAux, crearCategoriaAux } = require('../helpers');
require('../setup');

// Mock de la función subirACloudinary para no hacer llamadas reales a Cloudinary
jest.mock('../../src/middlewares/uploadMiddleware', () => {
    const multer = require('multer');
    const storage = multer.memoryStorage();
    const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

    return {
        upload,
        subirACloudinary: jest.fn().mockResolvedValue({
            secure_url: 'https://res.cloudinary.com/test/image/upload/v1/molicell_productos/mock.webp'
        })
    };
});

describe('CRUD /producto', () => {
    let token;
    let marca;
    let categoria;
    let productoCreado;

    beforeAll(async () => {
        token = await loginComoAdmin();
        marca = await crearMarcaAux(token, 'Samsung');
        categoria = await crearCategoriaAux(token, 'Celulares');
    });

    // ✅ ESCENARIOS EXITOSOS
    describe('✅ Escenarios exitosos', () => {
        it('debería crear producto con todos los campos + especificaciones + categorías → 201', async () => {
            const res = await request(app)
                .post('/producto')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Samsung Galaxy S23',
                    descripcion: 'Celular de gama alta',
                    precio: 850,
                    stock: 15,
                    marca_id: marca.id,
                    especificaciones: { RAM: '8 GB', Pantalla: '6.1 pulgadas' },
                    categorias: [categoria.id]
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe('Samsung Galaxy S23');
            expect(res.body.precio).toBe(850);
            expect(res.body.stock).toBe(15);
            expect(res.body.especificaciones).toEqual({ RAM: '8 GB', Pantalla: '6.1 pulgadas' });
            expect(res.body.categorias).toEqual(
                expect.arrayContaining([expect.objectContaining({ id: categoria.id })])
            );
            productoCreado = res.body;
        });

        it('debería crear producto sin especificaciones (opcional) → 201 + especificaciones = {}', async () => {
            const res = await request(app)
                .post('/producto')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Producto Sin Specs',
                    precio: 50,
                    stock: 5,
                    marca_id: marca.id
                });

            expect(res.status).toBe(201);
            expect(res.body.especificaciones).toEqual({});
        });

        it('debería crear producto sin categorías → 201 + categorias = []', async () => {
            const res = await request(app)
                .post('/producto')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Producto Sin Categorias',
                    precio: 30,
                    stock: 3,
                    marca_id: marca.id
                });

            expect(res.status).toBe(201);
            expect(res.body.categorias).toEqual([]);
        });

        it('debería crear producto sin imagen → 201 + img_url = null', async () => {
            const res = await request(app)
                .post('/producto')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Producto Sin Imagen',
                    precio: 20,
                    stock: 2,
                    marca_id: marca.id
                });

            expect(res.status).toBe(201);
            expect(res.body.img_url).toBeNull();
            expect(res.body.imagenes).toEqual([]);
        });

        it('debería crear producto con precio_costo y múltiples imágenes → 201', async () => {
            const res = await request(app)
                .post('/producto')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Producto Con Costo E Imagenes',
                    precio: 150,
                    precio_costo: 90,
                    stock: 10,
                    marca_id: marca.id,
                    imagenes: [
                        'https://res.cloudinary.com/test/img1.webp',
                        'https://res.cloudinary.com/test/img2.webp'
                    ]
                });

            expect(res.status).toBe(201);
            expect(res.body.precio_costo).toBe(90);
            expect(res.body.imagenes).toEqual([
                'https://res.cloudinary.com/test/img1.webp',
                'https://res.cloudinary.com/test/img2.webp'
            ]);
            expect(res.body.img_url).toBe('https://res.cloudinary.com/test/img1.webp');
        });

        it('debería obtener todos los productos → 200 + array', async () => {
            const res = await request(app).get('/producto');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
        });

        it('debería obtener producto por ID con categorías como objetos → 200', async () => {
            const res = await request(app).get(`/producto/${productoCreado.id}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(productoCreado.id);
            expect(res.body.categorias[0]).toHaveProperty('id');
            expect(res.body.categorias[0]).toHaveProperty('name');
        });

        it('debería obtener productos filtrados por categoría → 200', async () => {
            const res = await request(app).get(`/producto/categoria/${categoria.id}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('debería obtener productos filtrados por marca → 200', async () => {
            const res = await request(app).get(`/producto/marca/${marca.id}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('debería actualizar nombre del producto → 200', async () => {
            const res = await request(app)
                .patch(`/producto/${productoCreado.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Galaxy S23 Ultra' });

            expect(res.status).toBe(200);
            expect(res.body.name).toBe('Galaxy S23 Ultra');
        });

        it('debería actualizar stock del producto → 200', async () => {
            const res = await request(app)
                .patch(`/producto/${productoCreado.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ stock: 99 });

            expect(res.status).toBe(200);
            expect(res.body.stock).toBe(99);
        });

        it('debería actualizar especificaciones del producto → 200', async () => {
            const res = await request(app)
                .patch(`/producto/${productoCreado.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ especificaciones: { RAM: '12 GB', Bateria: '5000 mAh' } });

            expect(res.status).toBe(200);
            expect(res.body.especificaciones).toEqual({ RAM: '12 GB', Bateria: '5000 mAh' });
        });

        it('debería eliminar producto (soft delete) → 200', async () => {
            // Crear producto extra para eliminar
            const resCrear = await request(app)
                .post('/producto')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'ParaBorrar', precio: 10, stock: 1, marca_id: marca.id });

            const res = await request(app)
                .delete(`/producto/${resCrear.body.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });

        it('producto eliminado (soft delete) NO debería aparecer en la lista pública', async () => {
            // Crear y eliminar
            const resCrear = await request(app)
                .post('/producto')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'InvisibleTest', precio: 10, stock: 1, marca_id: marca.id });
            await request(app)
                .delete(`/producto/${resCrear.body.id}`)
                .set('Authorization', `Bearer ${token}`);

            // Verificar que no aparece en la lista
            const resLista = await request(app).get('/producto');
            const nombres = resLista.body.map(p => p.name);
            expect(nombres).not.toContain('InvisibleTest');
        });
    });

    // ❌ ESCENARIOS DE FALLO — Validación Joi
    describe('❌ Validación Joi', () => {
        it('debería rechazar producto sin name → 400', async () => {
            const res = await request(app)
                .post('/producto')
                .set('Authorization', `Bearer ${token}`)
                .send({ precio: 100, stock: 5, marca_id: marca.id });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('detalles');
        });

        it('debería rechazar producto sin precio → 400', async () => {
            const res = await request(app)
                .post('/producto')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Test', stock: 5, marca_id: marca.id });

            expect(res.status).toBe(400);
        });

        it('debería rechazar producto sin marca_id → 400', async () => {
            const res = await request(app)
                .post('/producto')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Test', precio: 100, stock: 5 });

            expect(res.status).toBe(400);
        });

        it('debería rechazar producto con precio negativo → 400', async () => {
            const res = await request(app)
                .post('/producto')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Test', precio: -50, stock: 5, marca_id: marca.id });

            expect(res.status).toBe(400);
        });

        it('debería rechazar producto con stock negativo → 400', async () => {
            const res = await request(app)
                .post('/producto')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Test', precio: 100, stock: -1, marca_id: marca.id });

            expect(res.status).toBe(400);
        });

        it('debería rechazar actualización con body vacío → 400 (Joi .min(1))', async () => {
            const res = await request(app)
                .patch(`/producto/${productoCreado.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(res.status).toBe(400);
        });
    });

    // 🧪 ESPECIFICACIONES DINÁMICAS
    describe('🧪 Especificaciones dinámicas — Restricciones de seguridad', () => {
        it('debería aceptar especificaciones válidas → 201', async () => {
            const res = await request(app)
                .post('/producto')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test Specs Validas',
                    precio: 100,
                    stock: 1,
                    marca_id: marca.id,
                    especificaciones: { RAM: '8 GB', Pantalla: '6.1 pulgadas OLED' }
                });

            expect(res.status).toBe(201);
        });

        it('debería rechazar especificación con clave de más de 50 caracteres → 400', async () => {
            const claveGigante = 'A'.repeat(51);
            const res = await request(app)
                .post('/producto')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test Clave Larga',
                    precio: 100,
                    stock: 1,
                    marca_id: marca.id,
                    especificaciones: { [claveGigante]: 'valor' }
                });

            expect(res.status).toBe(400);
        });

        it('debería rechazar especificación con valor de más de 150 caracteres → 400', async () => {
            const valorGigante = 'B'.repeat(151);
            const res = await request(app)
                .post('/producto')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test Valor Largo',
                    precio: 100,
                    stock: 1,
                    marca_id: marca.id,
                    especificaciones: { RAM: valorGigante }
                });

            expect(res.status).toBe(400);
        });

        it('debería rechazar más de 30 especificaciones → 400', async () => {
            const specs = {};
            for (let i = 0; i < 31; i++) {
                specs[`campo_${i}`] = `valor_${i}`;
            }

            const res = await request(app)
                .post('/producto')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test Muchas Specs',
                    precio: 100,
                    stock: 1,
                    marca_id: marca.id,
                    especificaciones: specs
                });

            expect(res.status).toBe(400);
        });

        it('debería rechazar especificación con valor anidado (objeto) → 400', async () => {
            const res = await request(app)
                .post('/producto')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test Anidado',
                    precio: 100,
                    stock: 1,
                    marca_id: marca.id,
                    especificaciones: { RAM: { tipo: 'DDR4', cantidad: '8GB' } }
                });

            expect(res.status).toBe(400);
        });

        it('debería rechazar especificación con valor numérico → 400', async () => {
            const res = await request(app)
                .post('/producto')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test Numerico',
                    precio: 100,
                    stock: 1,
                    marca_id: marca.id,
                    especificaciones: { RAM: 8 }
                });

            expect(res.status).toBe(400);
        });
    });

    // 🔒 SEGURIDAD
    describe('🔒 Seguridad', () => {
        it('debería rechazar crear producto sin token → 401', async () => {
            const res = await request(app)
                .post('/producto')
                .send({ name: 'Test', precio: 100, stock: 1, marca_id: marca.id });

            expect(res.status).toBe(401);
        });

        it('debería rechazar actualizar producto sin token → 401', async () => {
            const res = await request(app)
                .patch(`/producto/${productoCreado.id}`)
                .send({ name: 'Hack' });

            expect(res.status).toBe(401);
        });

        it('debería rechazar eliminar producto sin token → 401', async () => {
            const res = await request(app)
                .delete(`/producto/${productoCreado.id}`);

            expect(res.status).toBe(401);
        });

        it('debería permitir obtener productos sin token (ruta pública) → 200', async () => {
            const res = await request(app).get('/producto');

            expect(res.status).toBe(200);
        });
    });

    // 🧪 CASOS BORDE
    describe('🧪 Casos borde', () => {
        it('debería devolver 404 al obtener producto con ID inexistente', async () => {
            const res = await request(app).get('/producto/99999');

            expect(res.status).toBe(404);
        });

        it('debería devolver array vacío al filtrar por categoría sin productos', async () => {
            const catVacia = await request(app)
                .post('/categoria')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'CategoriaVacia' });

            const res = await request(app).get(`/producto/categoria/${catVacia.body.id}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it('debería devolver array vacío al filtrar por marca sin productos', async () => {
            const marcaVacia = await request(app)
                .post('/marca')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'MarcaVacia' });

            const res = await request(app).get(`/producto/marca/${marcaVacia.body.id}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });
    });
});
