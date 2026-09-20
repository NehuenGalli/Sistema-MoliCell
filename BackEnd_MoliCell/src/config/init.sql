CREATE TABLE marca (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE categoria (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE producto (
    id SERIAL PRIMARY KEY, 
    name VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(12, 2) NOT NULL,
    precio_costo NUMERIC(12, 2) DEFAULT 0,
    descuento BOOLEAN NOT NULL DEFAULT FALSE,
    descuento_precio NUMERIC(12, 2),
    destacado BOOLEAN NOT NULL DEFAULT FALSE,
    stock INT NOT NULL DEFAULT 0 CONSTRAINT check_stock_positivo CHECK (stock >= 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    img_url TEXT,
    imagenes TEXT[] DEFAULT '{}',
    marca_id INT REFERENCES marca(id) ON DELETE SET NULL,
    especificaciones JSONB DEFAULT '{}'::jsonb,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE producto_categoria (
    producto_id INT NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
    categoria_id INT NOT NULL REFERENCES categoria(id) ON DELETE CASCADE,
    PRIMARY KEY (producto_id, categoria_id)
);

CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (rol IN ('admin')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
); 

CREATE TABLE servicio_tecnico (
    id SERIAL PRIMARY KEY,
    codigo_seguimiento VARCHAR(20) UNIQUE NOT NULL,
    cliente_nombre VARCHAR(100),
    cliente_telefono VARCHAR(50),
    dispositivo VARCHAR(100) NOT NULL,
    falla_descripcion TEXT,
    presupuesto_estimado NUMERIC(12, 2),
    estado VARCHAR(50) DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En Proceso', 'Listo', 'Entregado')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE venta (
    id SERIAL PRIMARY KEY,
    codigo_venta VARCHAR(30) UNIQUE,
    monto NUMERIC(12, 2) NOT NULL CONSTRAINT chk_monto_positivo CHECK (monto >= 0),
    metodo_pago VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE venta_detalle (
    id SERIAL PRIMARY KEY,
    venta_id INT NOT NULL REFERENCES venta(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES producto(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CONSTRAINT chk_cantidad_positiva CHECK (cantidad > 0)
);

CREATE INDEX idx_producto_activo_stock ON producto (activo, stock);
CREATE INDEX idx_producto_marca ON producto (marca_id);
CREATE INDEX idx_producto_categoria_categoria ON producto_categoria (categoria_id, producto_id);
CREATE INDEX idx_servicio_tecnico_estado_creado ON servicio_tecnico (estado, creado_en DESC);
CREATE INDEX idx_servicio_tecnico_codigo_upper ON servicio_tecnico (UPPER(codigo_seguimiento));
CREATE INDEX idx_venta_creado ON venta (creado_en DESC);
CREATE INDEX idx_venta_detalle_venta ON venta_detalle (venta_id);
