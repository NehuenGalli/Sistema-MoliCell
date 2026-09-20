const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../index');
const { getJwtSecret, JWT_AUDIENCE, JWT_ISSUER } = require('../../src/services/auth.service');
require('../setup');

describe('controles de seguridad HTTP', () => {
    it('usa cookie HttpOnly y exige CSRF para mutaciones autenticadas por cookie', async () => {
        const agent = request.agent(app);
        const login = await agent
            .post('/auth/login')
            .send({ email: 'test@molicell.com', password: 'TestPassword123!' });

        expect(login.status).toBe(200);
        expect(login.headers['set-cookie'][0]).toContain('HttpOnly');
        expect(login.headers['set-cookie'][0]).toContain('SameSite=Lax');

        const session = await agent.get('/auth/session');
        expect(session.status).toBe(200);
        expect(session.body.data.usuario.email).toBe('test@molicell.com');

        const withoutCsrf = await agent.post('/categoria').send({ name: 'Seguridad' });
        expect(withoutCsrf.status).toBe(403);

        const withCsrf = await agent
            .post('/categoria')
            .set('X-CSRF-Token', login.body.data.csrfToken)
            .send({ name: 'Seguridad' });
        expect(withCsrf.status).toBe(201);

        const logout = await agent
            .post('/auth/logout')
            .set('X-CSRF-Token', login.body.data.csrfToken);
        expect(logout.status).toBe(204);
        expect((await agent.get('/auth/session')).status).toBe(401);
    });

    it('rechaza tokens firmados sin rol admin', async () => {
        const token = jwt.sign(
            { id: 99, email: 'user@test.com', rol: 'user', csrf: 'x' },
            getJwtSecret(),
            { algorithm: 'HS256', issuer: JWT_ISSUER, audience: JWT_AUDIENCE, expiresIn: '5m' }
        );
        const res = await request(app)
            .post('/marca')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'No autorizada' });
        expect(res.status).toBe(403);
    });

    it('bloquea orígenes no autorizados, oculta Express y responde 404 uniforme', async () => {
        const forbidden = await request(app)
            .get('/producto')
            .set('Origin', 'https://evil.example');
        expect(forbidden.status).toBe(403);

        const notFound = await request(app).get('/ruta-que-no-existe');
        expect(notFound.status).toBe(404);
        expect(notFound.headers).not.toHaveProperty('x-powered-by');
        expect(notFound.headers).toHaveProperty('x-content-type-options', 'nosniff');
    });

    it('valida nombres de catálogo y tamaño máximo del body', async () => {
        const login = await request(app)
            .post('/auth/login')
            .send({ email: 'test@molicell.com', password: 'TestPassword123!' });
        const token = login.body.data.token;

        const invalidName = await request(app)
            .post('/marca')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'x'.repeat(101) });
        expect(invalidName.status).toBe(400);

        const tooLarge = await request(app)
            .post('/marca')
            .set('Authorization', `Bearer ${token}`)
            .set('Content-Type', 'application/json')
            .send({ name: 'a', padding: 'x'.repeat(110 * 1024) });
        expect(tooLarge.status).toBe(413);
        expect(tooLarge.body.error).toBe('La solicitud excede el tamaño permitido.');
    });

    it('rechaza identificadores ambiguos antes de consultar PostgreSQL', async () => {
        const login = await request(app)
            .post('/auth/login')
            .send({ email: 'test@molicell.com', password: 'TestPassword123!' });
        const token = login.body.data.token;
        const authorization = { Authorization: `Bearer ${token}` };

        const [categoria, marca, producto, tecnico, venta] = await Promise.all([
            request(app).get('/categoria/1abc'),
            request(app).get('/marca/1abc'),
            request(app).get('/producto/1abc'),
            request(app).get('/tecnico/1abc').set(authorization),
            request(app).get('/venta/1abc').set(authorization)
        ]);

        for (const response of [categoria, marca, producto, tecnico, venta]) {
            expect(response.status).toBe(400);
        }
    });
});
