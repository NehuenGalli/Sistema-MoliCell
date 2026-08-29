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

//Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

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