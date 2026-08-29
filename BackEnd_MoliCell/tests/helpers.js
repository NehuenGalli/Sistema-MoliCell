const request = require('supertest');
const app = require('../index');

/**
 * Inicia sesión como admin de pruebas y devuelve el token JWT.
 * Este helper se reutiliza en TODOS los tests que necesitan autenticación.
 */
const loginComoAdmin = async () => {
    const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@molicell.com', password: 'TestPassword123!' });
    return res.body.data.token;
};

/**
 * Crea una marca auxiliar y devuelve el objeto completo (con id).
 */
const crearMarcaAux = async (token, nombre = 'Samsung') => {
    const res = await request(app)
        .post('/marca')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: nombre });
    return res.body;
};

/**
 * Crea una categoría auxiliar y devuelve el objeto completo (con id).
 */
const crearCategoriaAux = async (token, nombre = 'Celulares') => {
    const res = await request(app)
        .post('/categoria')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: nombre });
    return res.body;
};

/**
 * Crea un producto auxiliar con datos mínimos válidos.
 */
const crearProductoAux = async (token, marcaId, overrides = {}) => {
    const datos = {
        name: 'Producto Test',
        precio: 100,
        stock: 10,
        marca_id: marcaId,
        ...overrides
    };
    const res = await request(app)
        .post('/producto')
        .set('Authorization', `Bearer ${token}`)
        .send(datos);
    return res.body;
};

/**
 * Crea un servicio técnico auxiliar con datos mínimos válidos.
 */
const crearServicioAux = async (token, overrides = {}) => {
    const datos = {
        cliente_nombre: 'Juan Pérez',
        cliente_telefono: '1155667788',
        dispositivo: 'Samsung Galaxy S23',
        falla_descripcion: 'Pantalla rota',
        presupuesto_estimado: 15000,
        ...overrides
    };
    const res = await request(app)
        .post('/tecnico')
        .set('Authorization', `Bearer ${token}`)
        .send(datos);
    return res.body;
};

module.exports = {
    loginComoAdmin,
    crearMarcaAux,
    crearCategoriaAux,
    crearProductoAux,
    crearServicioAux
};
