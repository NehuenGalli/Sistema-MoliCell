const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const authRoute = require('./src/routes/auth.route');
const productoRoute = require('./src/routes/producto.route');
const marcaRoute = require('./src/routes/marca.route');
const categoriaRoute = require('./src/routes/categoria.route');
const ventaRoute = require('./src/routes/venta.route');
const tecnicoRoute = require('./src/routes/tecnico.route');


const db = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 3000;
const DEFAULT_FRONTEND_ORIGINS = [
    'https://molicell.store',
    'https://www.molicell.store',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
];
const allowedOrigins = (process.env.FRONTEND_ORIGINS || DEFAULT_FRONTEND_ORIGINS.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

//Middleware
app.use(cors({
    origin(origin, callback) {
        // Las llamadas de pruebas, health checks y herramientas de servidor no
        // envían Origin. Los navegadores sí y deben pertenecer a esta lista.
        callback(null, !origin || allowedOrigins.includes(origin));
    }
}));
app.use(helmet());
app.use(express.json({ limit: '100kb' }));

// Rutas
app.use('/auth', authRoute);
app.use('/producto', productoRoute);
app.use('/marca', marcaRoute);
app.use('/categoria', categoriaRoute);
app.use('/venta', ventaRoute);
app.use('/tecnico', tecnicoRoute);

// Middleware de Manejo Global de Errores
app.use((err, req, res, next) => {
    console.error('❌ Error no capturado en servidor:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Ocurrió un error interno en el servidor.'
    });
});

// Solo levantar el servidor si se ejecuta directamente (no desde tests)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    });
}

module.exports = app;
