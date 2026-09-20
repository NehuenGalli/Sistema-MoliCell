const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../index');
require('../setup');

describe('Auth Middleware — Protección de rutas', () => {
    // Usamos GET /marca como ruta pública y POST /marca como ruta protegida para probar

    it('debería rechazar petición sin header Authorization → 401', async () => {
        const res = await request(app)
            .post('/marca')
            .send({ name: 'TestMarca' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Token no proporcionado');
    });

    it('debería rechazar petición con Authorization sin prefijo Bearer → 401', async () => {
        const res = await request(app)
            .post('/marca')
            .set('Authorization', 'TokenSinBearer')
            .send({ name: 'TestMarca' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Token no proporcionado');
    });

    it('debería rechazar petición con token JWT malformado/basura → 401', async () => {
        const res = await request(app)
            .post('/marca')
            .set('Authorization', 'Bearer esto.no.es.un.jwt.valido')
            .send({ name: 'TestMarca' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Token inválido o expirado');
    });

    it('debería tratar una cookie mal codificada como sesión inválida → 401', async () => {
        const res = await request(app)
            .post('/marca')
            .set('Cookie', 'molicell_admin_session=%')
            .send({ name: 'TestMarca' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Token no proporcionado');
    });

    it('debería rechazar petición con token firmado con un secret diferente → 401', async () => {
        const tokenFalso = jwt.sign(
            { id: 1, email: 'test@molicell.com' },
            'SECRET_COMPLETAMENTE_DIFERENTE',
            { expiresIn: '1h' }
        );

        const res = await request(app)
            .post('/marca')
            .set('Authorization', `Bearer ${tokenFalso}`)
            .send({ name: 'TestMarca' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Token inválido o expirado');
    });

    it('debería rechazar petición con token JWT expirado → 401', async () => {
        const tokenExpirado = jwt.sign(
            { id: 1, email: 'test@molicell.com' },
            process.env.JWT_SECRET,
            { expiresIn: '0s' } // Expira inmediatamente
        );

        // Esperar un instante para asegurar que expire
        await new Promise(resolve => setTimeout(resolve, 50));

        const res = await request(app)
            .post('/marca')
            .set('Authorization', `Bearer ${tokenExpirado}`)
            .send({ name: 'TestMarca' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Token inválido o expirado');
    });
});
