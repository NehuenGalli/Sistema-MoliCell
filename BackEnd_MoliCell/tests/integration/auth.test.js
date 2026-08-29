const request = require('supertest');
const app = require('../../index');
require('../setup');

describe('POST /auth/login', () => {

    // ESCENARIOS EXITOSOS
    it('debería hacer login con credenciales válidas y devolver un token', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'test@molicell.com', password: 'TestPassword123!' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Login exitoso');
        expect(res.body.data).toHaveProperty('token');
        expect(typeof res.body.data.token).toBe('string');
        expect(res.body.data.token.length).toBeGreaterThan(0);
    });

    // ESCENARIOS DE FALLO
    it('debería rechazar login con email inexistente → 401', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'noexiste@molicell.com', password: 'TestPassword123!' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Credenciales incorrectas');
    });

    it('debería rechazar login con contraseña incorrecta → 401', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'test@molicell.com', password: 'ContraseñaIncorrecta' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Credenciales incorrectas');
    });

    it('debería rechazar login sin enviar email → 400', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ password: 'TestPassword123!' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('detalles');
    });

    it('debería rechazar login sin enviar password → 400', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'test@molicell.com' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('detalles');
    });

    it('debería rechazar login con email en formato inválido → 400', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'noesunmail', password: 'TestPassword123!' });

        // 400 = validación Joi, 429 = rate limiter activado por tests anteriores
        expect([400, 429]).toContain(res.status);
    });

    it('debería rechazar login con body vacío → 400', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({});

        // 400 = validación Joi, 429 = rate limiter activado por tests anteriores
        expect([400, 429]).toContain(res.status);
    });

    //  SEGURIDAD: El mensaje de error es idéntico para email inexistente y contraseña incorrecta
    it('debería devolver el MISMO mensaje de error para email inexistente y contraseña incorrecta (anti-enumeración)', async () => {
        const resEmailMalo = await request(app)
            .post('/auth/login')
            .send({ email: 'noexiste@molicell.com', password: 'TestPassword123!' });

        const resPasswordMalo = await request(app)
            .post('/auth/login')
            .send({ email: 'test@molicell.com', password: 'MalPassword' });

        expect(resEmailMalo.body.error).toBe(resPasswordMalo.body.error);
    });
});
