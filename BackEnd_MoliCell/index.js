const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const authRoute = require('./src/routes/auth.route');
const productoRoute = require('./src/routes/producto.route');
const marcaRoute = require('./src/routes/marca.route');
const categoriaRoute = require('./src/routes/categoria.route');
const ventaRoute = require('./src/routes/venta.route');
const tecnicoRoute = require('./src/routes/tecnico.route');
const dashboardRoute = require('./src/routes/dashboard.route');
const gastoRoute = require('./src/routes/gasto.route');
const deudaRoute = require('./src/routes/deuda.route');


const db = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 3000;
const DEFAULT_FRONTEND_ORIGINS = [
    'https://molicell.store',
    'https://www.molicell.store',
    ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173'])
];
const allowedOrigins = (process.env.FRONTEND_ORIGINS || DEFAULT_FRONTEND_ORIGINS.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.disable('x-powered-by');

//Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
// Debe ejecutarse antes de CORS y del parser para contar también solicitudes
// rechazadas por origen o tamaño, evitando amplificación de CPU y logs.
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes. Intenta nuevamente más tarde.' }
}));
app.use(cors({
    origin(origin, callback) {
        // Las llamadas de pruebas, health checks y herramientas de servidor no
        // envían Origin. Los navegadores sí y deben pertenecer a esta lista.
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        const error = new Error('Origen no autorizado');
        error.status = 403;
        return callback(error);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));
app.use(express.json({ limit: '100kb' }));

// Rutas
app.use('/auth', authRoute);
app.use('/producto', productoRoute);
app.use('/marca', marcaRoute);
app.use('/categoria', categoriaRoute);
app.use('/venta', ventaRoute);
app.use('/tecnico', tecnicoRoute);
app.use('/dashboard', dashboardRoute);
app.use('/gasto', gastoRoute);
app.use('/deuda', deudaRoute);

app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Middleware de Manejo Global de Errores
app.use((err, req, res, next) => {
    console.error('❌ Error no capturado en servidor:', err);
    const reportedStatus = err.type === 'entity.too.large' ? 413 : err.status;
    const status = Number.isInteger(reportedStatus) && reportedStatus >= 400 && reportedStatus < 600
        ? reportedStatus
        : (err.name === 'MulterError' ? 400 : 500);
    const message = status === 413
        ? 'La solicitud excede el tamaño permitido.'
        : (status < 500 && err.message ? err.message : 'Ocurrió un error interno en el servidor.');
    res.status(status).json({ error: message });
});

// Solo levantar el servidor si se ejecuta directamente (no desde tests)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    });
}

module.exports = app;
