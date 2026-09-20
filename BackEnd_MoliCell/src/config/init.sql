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
    subtotal NUMERIC(12, 2) NOT NULL CONSTRAINT chk_subtotal_positivo CHECK (subtotal >= 0),
    descuento_porcentaje NUMERIC(5, 2) NOT NULL DEFAULT 0 CONSTRAINT chk_descuento_porcentaje CHECK (descuento_porcentaje BETWEEN 0 AND 100),
    descuento_monto NUMERIC(12, 2) NOT NULL DEFAULT 0 CONSTRAINT chk_descuento_monto CHECK (descuento_monto >= 0),
    metodo_pago VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE venta_detalle (
    id SERIAL PRIMARY KEY,
    venta_id INT NOT NULL REFERENCES venta(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES producto(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CONSTRAINT chk_cantidad_positiva CHECK (cantidad > 0),
    precio_unitario NUMERIC(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    costo_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (costo_unitario >= 0)
);

CREATE TABLE gasto (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(30) NOT NULL CHECK (categoria IN ('Factura', 'Proveedor', 'Alquiler', 'Servicios', 'Impuestos', 'Sueldos', 'General', 'Otro')),
    descripcion VARCHAR(200) NOT NULL,
    monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    proveedor VARCHAR(120),
    comprobante VARCHAR(80),
    notas TEXT,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE deuda (
    id SERIAL PRIMARY KEY,
    persona_nombre VARCHAR(120) NOT NULL,
    telefono VARCHAR(50),
    concepto VARCHAR(240) NOT NULL,
    origen VARCHAR(20) NOT NULL CHECK (origen IN ('Venta', 'Servicio', 'Otro')),
    referencia VARCHAR(80),
    monto_total NUMERIC(12, 2) NOT NULL CHECK (monto_total > 0),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    vencimiento DATE,
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Parcial', 'Pagada')),
    notas TEXT,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE deuda_pago (
    id SERIAL PRIMARY KEY,
    deuda_id INT NOT NULL REFERENCES deuda(id) ON DELETE CASCADE,
    monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    notas VARCHAR(500),
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_producto_activo_stock ON producto (activo, stock);
CREATE INDEX idx_producto_marca ON producto (marca_id);
CREATE INDEX idx_producto_categoria_categoria ON producto_categoria (categoria_id, producto_id);
CREATE INDEX idx_servicio_tecnico_estado_creado ON servicio_tecnico (estado, creado_en DESC);
CREATE INDEX idx_servicio_tecnico_codigo_upper ON servicio_tecnico (UPPER(codigo_seguimiento));
CREATE INDEX idx_venta_creado ON venta (creado_en DESC);
CREATE INDEX idx_venta_detalle_venta ON venta_detalle (venta_id);
CREATE INDEX idx_gasto_fecha ON gasto (fecha DESC, id DESC);
CREATE INDEX idx_gasto_categoria_fecha ON gasto (categoria, fecha DESC);
CREATE INDEX idx_deuda_estado_fecha ON deuda (estado, fecha DESC);
CREATE INDEX idx_deuda_pago_deuda_fecha ON deuda_pago (deuda_id, fecha DESC, id DESC);
