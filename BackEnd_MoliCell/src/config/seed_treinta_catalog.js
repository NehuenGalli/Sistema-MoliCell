const pool = require('./db');

// Catálogo extraído de https://catalogo.treinta.co/molicell
const CATALOG_CATEGORIES = [
  'Auriculares',
  'Cables y cargadores',
  'Celulares',
  'CONSOLAS',
  'PARLANTES',
  'Accesorios PC',
  'Adaptadores',
  'Accesorios auto',
  'Baterías portatil',
  'Camaras de seguridad'
];

const CATALOG_BRANDS = [
  'Apple',
  'Samsung',
  'Motorola',
  'Xiaomi',
  'JBL',
  'Ditron',
  'Aitech',
  'Soul',
  'Netmak',
  'Sony',
  'LDNIO',
  'Malibu',
  'HBL Tech',
  'Fetuzz',
  'Pro21',
  'Hytoshy',
  'Ibek',
  'Kosmo',
  'Genérico'
];

const CATALOG_PRODUCTS = [
  // --- AURICULARES ---
  {
    name: 'Apple EarPods Lightning blancos',
    category: 'Auriculares',
    brand: 'Apple',
    precio: 16000,
    precio_costo: 9500,
    stock: 15,
    descuento: true,
    descuento_precio: 13500,
    destacado: true,
    descripcion: 'Auriculares blancos de cable con conector Lightning original. Sonido de alta definición y control remoto integrado.',
    img_url: 'https://cdn.treinta.co/ai-images/250e40ce-2f29-5144-853e-564b20f04d8c_81c59c644c7ea5ac6517eb498cbb321b20e849fa43452cc8d2577862402571ea.jpeg',
    imagenes: [
      'https://cdn.treinta.co/ai-images/250e40ce-2f29-5144-853e-564b20f04d8c_81c59c644c7ea5ac6517eb498cbb321b20e849fa43452cc8d2577862402571ea.jpeg',
      'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/b16e788f-3f94-5411-aaa2-0bc6002aae69.jpg'
    ],
    especificaciones: { "Conexión": "Lightning", "Color": "Blanco", "Micrófono": "Incorporado" }
  },
  {
    name: 'AURICULAR JBL tour pro 2',
    category: 'Auriculares',
    brand: 'JBL',
    precio: 50000,
    precio_costo: 32000,
    stock: 8,
    descuento: true,
    descuento_precio: 42999,
    destacado: true,
    descripcion: 'Auriculares inalámbricos premium JBL Tour Pro 2 con cancelación de ruido activa inteligente y estuche con pantalla táctil inteligente.',
    img_url: 'https://cdn.treinta.co/ai-images/250e40ce-2f29-5144-853e-564b20f04d8c_d74987243164fa08150be68b6d4408e0a82814b300adebfb1ab587d92f0f8e79.jpeg',
    imagenes: [
      'https://cdn.treinta.co/ai-images/250e40ce-2f29-5144-853e-564b20f04d8c_d74987243164fa08150be68b6d4408e0a82814b300adebfb1ab587d92f0f8e79.jpeg'
    ],
    especificaciones: { "Bluetooth": "5.3", "Cancelación de Ruido": "Activa Adaptativa", "Batería": "Hasta 40 horas" }
  },
  {
    name: 'AURICULAR JBL tune 700 Wireless',
    category: 'Auriculares',
    brand: 'JBL',
    precio: 32000,
    precio_costo: 20000,
    stock: 12,
    descuento: false,
    descuento_precio: null,
    destacado: true,
    descripcion: 'Auriculares de diadema inalámbricos JBL Tune 700BT con sonido Pure Bass potente y llamadas manos libres.',
    img_url: 'https://cdn.treinta.co/ai-images/250e40ce-2f29-5144-853e-564b20f04d8c_0ace1f27dd05a793ff40d455cb2dc30204128f1be292c643d4649d4f022bdbb4.jpeg',
    imagenes: [
      'https://cdn.treinta.co/ai-images/250e40ce-2f29-5144-853e-564b20f04d8c_0ace1f27dd05a793ff40d455cb2dc30204128f1be292c643d4649d4f022bdbb4.jpeg'
    ],
    especificaciones: { "Diseño": "Over-Ear Plegable", "Autonomía": "27 horas", "Sonido": "JBL Pure Bass" }
  },
  {
    name: 'AURICULAR IPHONE 2DA GENERACIÓN',
    category: 'Auriculares',
    brand: 'Apple',
    precio: 30000,
    precio_costo: 18000,
    stock: 10,
    descuento: true,
    descuento_precio: 25500,
    destacado: false,
    descripcion: 'Auriculares Bluetooth estilo AirPods 2 con estuche de carga inalámbrica, emparejamiento automático y micrófono HD.',
    img_url: 'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/b16e788f-3f94-5411-aaa2-0bc6002aae69.jpg',
    imagenes: [
      'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/b16e788f-3f94-5411-aaa2-0bc6002aae69.jpg'
    ],
    especificaciones: { "Conectividad": "Bluetooth 5.0", "Compatibilidad": "iOS & Android", "Control": "Táctil" }
  },
  {
    name: 'AURICULAR NETMAK PC Y PS4 Gamer',
    category: 'Auriculares',
    brand: 'Netmak',
    precio: 28000,
    precio_costo: 16000,
    stock: 9,
    descuento: false,
    descuento_precio: null,
    destacado: false,
    descripcion: 'Headset gamer acolchado con micrófono flexible y vincha ajustable para PlayStation 4, PC y smartphones.',
    img_url: 'https://cdn.treinta.co/ai-images/250e40ce-2f29-5144-853e-564b20f04d8c_92bd801de434908ca54b35d74947e4d4c2dc7a9ac97f5fdf4fee3a3bf76e8ed8.jpeg',
    imagenes: [
      'https://cdn.treinta.co/ai-images/250e40ce-2f29-5144-853e-564b20f04d8c_92bd801de434908ca54b35d74947e4d4c2dc7a9ac97f5fdf4fee3a3bf76e8ed8.jpeg'
    ],
    especificaciones: { "Compatibilidad": "PS4, PC, Switch", "Conector": "Jack 3.5mm", "Almohadillas": "Memory foam" }
  },
  {
    name: 'AURICULAR IN PODS I12 TWS',
    category: 'Auriculares',
    brand: 'Genérico',
    precio: 8000,
    precio_costo: 3800,
    stock: 25,
    descuento: true,
    descuento_precio: 6500,
    destacado: false,
    descripcion: 'Auriculares Bluetooth i12 TWS con estuche de carga compacto, botones táctiles y sonido estéreo.',
    img_url: 'https://cdn.treinta.co/web-app/inventory/250e40ce-2f29-5144-853e-564b20f04d8c/9e3d563f-eda1-5c4e-ba4f-c78ae1839601.jpeg',
    imagenes: [
      'https://cdn.treinta.co/web-app/inventory/250e40ce-2f29-5144-853e-564b20f04d8c/9e3d563f-eda1-5c4e-ba4f-c78ae1839601.jpeg'
    ],
    especificaciones: { "Tipo": "In-Ear", "Bluetooth": "5.0", "Tiempo de uso": "3 horas continuas" }
  },

  // --- CELULARES ---
  {
    name: 'Motorola Moto G15 128GB Azul',
    category: 'Celulares',
    brand: 'Motorola',
    precio: 320000,
    precio_costo: 240000,
    stock: 6,
    descuento: true,
    descuento_precio: 289999,
    destacado: true,
    descripcion: 'Smartphone Motorola Moto G15 con 128GB de almacenamiento, cámara de 50MP con IA, pantalla fluida de 90Hz y batería de 5000 mAh.',
    img_url: 'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/e843cd90-75c4-5ef3-bd97-7937e292e1d3.jpg',
    imagenes: [
      'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/e843cd90-75c4-5ef3-bd97-7937e292e1d3.jpg'
    ],
    especificaciones: { "Memoria": "128 GB", "RAM": "4 GB (+ RAM Boost)", "Cámara Principal": "50 MP", "Batería": "5000 mAh" }
  },
  {
    name: 'Samsung Galaxy A16 128GB Negro',
    category: 'Celulares',
    brand: 'Samsung',
    precio: 320000,
    precio_costo: 245000,
    stock: 5,
    descuento: false,
    descuento_precio: null,
    destacado: true,
    descripcion: 'Celular Samsung Galaxy A16 con pantalla Super AMOLED de 6.7", triple cámara trasera y procesador Octa-Core de alto rendimiento.',
    img_url: 'https://cdn.treinta.co/ai-images/250e40ce-2f29-5144-853e-564b20f04d8c_1ec9cc6efef638d25c026cf6dfb3bd8f8de47e4e5b5e4e45902754070edd8755.jpeg',
    imagenes: [
      'https://cdn.treinta.co/ai-images/250e40ce-2f29-5144-853e-564b20f04d8c_1ec9cc6efef638d25c026cf6dfb3bd8f8de47e4e5b5e4e45902754070edd8755.jpeg'
    ],
    especificaciones: { "Pantalla": "6.7 FHD+ Super AMOLED", "Almacenamiento": "128 GB", "Cámara": "50MP + 5MP + 2MP" }
  },
  {
    name: 'Xiaomi Redmi 15C 128GB Azul',
    category: 'Celulares',
    brand: 'Xiaomi',
    precio: 280000,
    precio_costo: 210000,
    stock: 7,
    descuento: true,
    descuento_precio: 249999,
    destacado: true,
    descripcion: 'Smartphone Xiaomi Redmi 15C con diseño ultradelgado, pantalla de 6.88" a 120Hz, cámara IA de 50MP y carga rápida de 18W.',
    img_url: 'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/3f3b2c01-75ea-5014-8cbd-aa2641da4aa7.jpg',
    imagenes: [
      'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/3f3b2c01-75ea-5014-8cbd-aa2641da4aa7.jpg'
    ],
    especificaciones: { "Pantalla": "6.88 Dot Drop 120Hz", "Procesador": "Helio G81-Ultra", "Batería": "5160 mAh" }
  },

  // --- CABLES Y CARGADORES ---
  {
    name: 'Cargador IPhone USB-C 20W Power Adapter',
    category: 'Cables y cargadores',
    brand: 'Apple',
    precio: 15000,
    precio_costo: 7500,
    stock: 30,
    descuento: true,
    descuento_precio: 12900,
    destacado: true,
    descripcion: 'Adaptador de corriente USB-C de 20 W para carga rápida de iPhone 12, 13, 14, 15 y 16 Pro Max.',
    img_url: 'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/3f3b2c01-75ea-5014-8cbd-aa2641da4aa7.jpg',
    imagenes: [
      'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/3f3b2c01-75ea-5014-8cbd-aa2641da4aa7.jpg'
    ],
    especificaciones: { "Potencia": "20W", "Ficha": "USB-C", "Tecnología": "Power Delivery (PD)" }
  },
  {
    name: 'Cargador Samsung 45W Carga Super Rápida Tipo C',
    category: 'Cables y cargadores',
    brand: 'Samsung',
    precio: 25000,
    precio_costo: 13500,
    stock: 18,
    descuento: false,
    descuento_precio: null,
    destacado: true,
    descripcion: 'Cargador de pared Samsung Super Fast Charging 2.0 de 45W con cable USB-C a USB-C incluido.',
    img_url: 'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/85dcc0f5-f57b-5e58-8fd2-c8137fa32cef.jpg',
    imagenes: [
      'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/85dcc0f5-f57b-5e58-8fd2-c8137fa32cef.jpg'
    ],
    especificaciones: { "Potencia": "45W", "Protocolo": "PPS / PD 3.0", "Compatibilidad": "Galaxy S22/S23/S24 Ultra" }
  },
  {
    name: 'CARGADOR MOTOROLA TURBO POWER 68W DUO C/CABLE',
    category: 'Cables y cargadores',
    brand: 'Motorola',
    precio: 22000,
    precio_costo: 12000,
    stock: 14,
    descuento: true,
    descuento_precio: 18900,
    destacado: false,
    descripcion: 'Cargador TurboPower 68W de doble puerto (USB-C + USB-A) para cargar dos dispositivos simultáneamente a máxima velocidad.',
    img_url: 'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/8695c954-4a9f-5351-a61c-f4925015e7ed.jpg',
    imagenes: [
      'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/8695c954-4a9f-5351-a61c-f4925015e7ed.jpg'
    ],
    especificaciones: { "Potencia": "68W", "Puertos": "USB-C + USB-A", "Incluye": "Cable 6.5A Type-C" }
  },
  {
    name: 'CABLE AITECH 120W C.RÁPIDA TC-TC MALLADO',
    category: 'Cables y cargadores',
    brand: 'Aitech',
    precio: 8000,
    precio_costo: 3200,
    stock: 40,
    descuento: false,
    descuento_precio: null,
    destacado: false,
    descripcion: 'Cable de alta resistencia tipo C a tipo C de 120W reforzado en nylon mallado. Apto para celulares gama alta y notebooks.',
    img_url: 'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/e9affb6c-d1ac-52f0-b125-3ba9de998fc2.jpg',
    imagenes: [
      'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/e9affb6c-d1ac-52f0-b125-3ba9de998fc2.jpg'
    ],
    especificaciones: { "Potencia": "120W", "Largo": "1.2 metros", "Material": "Nylon trenzado" }
  },
  {
    name: 'Cable IPhone Mallado USB-C a Lightning 1m',
    category: 'Cables y cargadores',
    brand: 'Apple',
    precio: 10000,
    precio_costo: 4500,
    stock: 22,
    descuento: true,
    descuento_precio: 7999,
    destacado: false,
    descripcion: 'Cable mallado blanco de carga rápida USB-C a Lightning para iPhone y iPad.',
    img_url: 'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/b16e788f-3f94-5411-aaa2-0bc6002aae69.jpg',
    imagenes: [
      'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/b16e788f-3f94-5411-aaa2-0bc6002aae69.jpg'
    ],
    especificaciones: { "Conector": "Type-C a Lightning", "Longitud": "1 metro", "Velocidad": "Carga rápida PD" }
  },

  // --- ADAPTADORES & ACCESORIOS PC ---
  {
    name: 'Aitech USB Hub 7 puertos con switch independiente',
    category: 'Accesorios PC',
    brand: 'Aitech',
    precio: 25000,
    precio_costo: 14000,
    stock: 11,
    descuento: true,
    descuento_precio: 21500,
    destacado: true,
    descripcion: 'Concentrador USB Hub de 7 puertos USB 2.0/3.0 de alta velocidad con interruptores LED individuales para cada puerto.',
    img_url: 'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/e9affb6c-d1ac-52f0-b125-3ba9de998fc2.jpg',
    imagenes: [
      'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/e9affb6c-d1ac-52f0-b125-3ba9de998fc2.jpg'
    ],
    especificaciones: { "Puertos": "7 USB", "Interruptores": "Individuales con LED", "Color": "Negro" }
  },
  {
    name: 'Adaptador 5 en 1 Tipo C Multipuerto',
    category: 'Adaptadores',
    brand: 'Genérico',
    precio: 15000,
    precio_costo: 8000,
    stock: 16,
    descuento: false,
    descuento_precio: null,
    destacado: false,
    descripcion: 'Hub adaptador USB-C multifunción con lector de tarjetas SD/TF y puertos USB para notebooks y tablets.',
    img_url: 'https://cdn.treinta.co/ai-images/250e40ce-2f29-5144-853e-564b20f04d8c_d74987243164fa08150be68b6d4408e0a82814b300adebfb1ab587d92f0f8e79.jpeg',
    imagenes: [
      'https://cdn.treinta.co/ai-images/250e40ce-2f29-5144-853e-564b20f04d8c_d74987243164fa08150be68b6d4408e0a82814b300adebfb1ab587d92f0f8e79.jpeg'
    ],
    especificaciones: { "Conexión": "USB Tipo C", "Ranuras": "SD, MicroSD, USB 3.0" }
  },
  {
    name: 'ANTENA WIFI DITRON 600Mbps Dual Band',
    category: 'Accesorios PC',
    brand: 'Ditron',
    precio: 10000,
    precio_costo: 5000,
    stock: 19,
    descuento: true,
    descuento_precio: 8500,
    destacado: false,
    descripcion: 'Placa de red inalámbrica USB Ditron con antena externa de alta ganancia. Velocidades de hasta 600Mbps en 2.4GHz.',
    img_url: 'https://cdn.treinta.co/web-app/inventory/250e40ce-2f29-5144-853e-564b20f04d8c/9e3d563f-eda1-5c4e-ba4f-c78ae1839601.jpeg',
    imagenes: [
      'https://cdn.treinta.co/web-app/inventory/250e40ce-2f29-5144-853e-564b20f04d8c/9e3d563f-eda1-5c4e-ba4f-c78ae1839601.jpeg'
    ],
    especificaciones: { "Velocidad": "600 Mbps", "Frecuencia": "2.4 GHz", "Interfaz": "USB 2.0" }
  },

  // --- CONSOLAS & GAMING ---
  {
    name: 'Sony Cable PS3 / Joystick Mini USB Reforzado',
    category: 'CONSOLAS',
    brand: 'Sony',
    precio: 7500,
    precio_costo: 3000,
    stock: 20,
    descuento: false,
    descuento_precio: null,
    destacado: false,
    descripcion: 'Cable reforzado de carga y datos con filtro magnético antirruido para mandos DualShock 3 de PlayStation 3.',
    img_url: 'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/e843cd90-75c4-5ef3-bd97-7937e292e1d3.jpg',
    imagenes: [
      'https://cdn.treinta.co/new-products/products/250e40ce-2f29-5144-853e-564b20f04d8c/e843cd90-75c4-5ef3-bd97-7937e292e1d3.jpg'
    ],
    especificaciones: { "Ficha": "Mini USB V3", "Filtro": "Ferrita incluido", "Largo": "1.8 metros" }
  },

  // --- ACCESORIOS AUTO ---
  {
    name: 'CARGADOR AUTO HBL TECH 5 EN 1 Carga Rápida',
    category: 'Accesorios auto',
    brand: 'HBL Tech',
    precio: 28000,
    precio_costo: 15000,
    stock: 12,
    descuento: true,
    descuento_precio: 23900,
    destacado: true,
    descripcion: 'Cargador de auto inteligente para encendedor con 5 salidas de carga rápida, cables integrados y voltímetro digital.',
    img_url: 'https://cdn.treinta.co/ai-images/250e40ce-2f29-5144-853e-564b20f04d8c_92bd801de434908ca54b35d74947e4d4c2dc7a9ac97f5fdf4fee3a3bf76e8ed8.jpeg',
    imagenes: [
      'https://cdn.treinta.co/ai-images/250e40ce-2f29-5144-853e-564b20f04d8c_92bd801de434908ca54b35d74947e4d4c2dc7a9ac97f5fdf4fee3a3bf76e8ed8.jpeg'
    ],
    especificaciones: { "Voltaje": "12V - 24V", "Puertos": "USB + Type-C + Cables retráctiles", "Display": "Voltaje en tiempo real" }
  }
];

async function seedTreintaCatalog() {
  const client = await pool.connect();
  try {
    console.log('🚀 Iniciando proceso de migración y seed del catálogo Treinta...');

    // 1. Asegurar columna 'destacado' en la tabla 'producto'
    await client.query(`
      ALTER TABLE producto 
      ADD COLUMN IF NOT EXISTS destacado BOOLEAN NOT NULL DEFAULT FALSE;
    `);
    console.log('✅ Columna "destacado" verificada/creada en la tabla producto.');

    await client.query('BEGIN');

    // 2. Insertar o verificar Categorías
    const categoriaMap = {};
    for (const catName of CATALOG_CATEGORIES) {
      const exist = await client.query(`SELECT id FROM categoria WHERE name ILIKE $1 ORDER BY id ASC LIMIT 1`, [catName]);
      if (exist.rows.length > 0) {
        categoriaMap[catName] = exist.rows[0].id;
      } else {
        const insertRes = await client.query(`INSERT INTO categoria (name) VALUES ($1) RETURNING id`, [catName]);
        categoriaMap[catName] = insertRes.rows[0].id;
      }
    }

    // Limpiar categorías duplicadas sobrantes si existen
    for (const catName of CATALOG_CATEGORIES) {
      const mainId = categoriaMap[catName];
      const dupes = await client.query(`SELECT id FROM categoria WHERE name ILIKE $1 AND id <> $2`, [catName, mainId]);
      for (const dupe of dupes.rows) {
        // Reasignar productos a la categoría principal
        await client.query(`
          INSERT INTO producto_categoria (producto_id, categoria_id)
          SELECT producto_id, $1 FROM producto_categoria WHERE categoria_id = $2
          ON CONFLICT (producto_id, categoria_id) DO NOTHING;
        `, [mainId, dupe.id]);
        await client.query(`DELETE FROM categoria WHERE id = $1`, [dupe.id]);
      }
    }
    console.log(`✅ ${Object.keys(categoriaMap).length} Categorías listas en la BD.`);

    // 3. Insertar o verificar Marcas
    const marcaMap = {};
    for (const brandName of CATALOG_BRANDS) {
      const exist = await client.query(`SELECT id FROM marca WHERE name ILIKE $1 ORDER BY id ASC LIMIT 1`, [brandName]);
      if (exist.rows.length > 0) {
        marcaMap[brandName] = exist.rows[0].id;
      } else {
        const insertRes = await client.query(`INSERT INTO marca (name) VALUES ($1) RETURNING id`, [brandName]);
        marcaMap[brandName] = insertRes.rows[0].id;
      }
    }

    // Limpiar marcas duplicadas si existen
    for (const brandName of CATALOG_BRANDS) {
      const mainId = marcaMap[brandName];
      const dupes = await client.query(`SELECT id FROM marca WHERE name ILIKE $1 AND id <> $2`, [brandName, mainId]);
      for (const dupe of dupes.rows) {
        await client.query(`UPDATE producto SET marca_id = $1 WHERE marca_id = $2`, [mainId, dupe.id]);
        await client.query(`DELETE FROM marca WHERE id = $1`, [dupe.id]);
      }
    }
    console.log(`✅ ${Object.keys(marcaMap).length} Marcas listas en la BD.`);

    // 4. Insertar Productos reales del catálogo Treinta
    let productosInsertados = 0;
    for (const p of CATALOG_PRODUCTS) {
      const marcaId = marcaMap[p.brand] || marcaMap['Genérico'] || 1;
      const categoriaId = categoriaMap[p.category];

      // Verificamos si ya existe por nombre exacto
      const prodExist = await client.query(`SELECT id FROM producto WHERE name = $1 LIMIT 1`, [p.name]);

      let prodId;
      if (prodExist.rows.length > 0) {
        prodId = prodExist.rows[0].id;
        // Actualizamos los datos para asegurar que tenga las imágenes y flags correctos
        await client.query(`
          UPDATE producto 
          SET descripcion = $1, precio = $2, precio_costo = $3, descuento = $4, descuento_precio = $5,
              destacado = $6, stock = $7, activo = true, img_url = $8, imagenes = $9, marca_id = $10, especificaciones = $11
          WHERE id = $12
        `, [
          p.descripcion, p.precio, p.precio_costo, p.descuento, p.descuento_precio,
          p.destacado, p.stock, p.img_url, p.imagenes, marcaId, JSON.stringify(p.especificaciones), prodId
        ]);
      } else {
        const insertRes = await client.query(`
          INSERT INTO producto (name, descripcion, precio, precio_costo, descuento, descuento_precio, destacado, stock, activo, img_url, imagenes, marca_id, especificaciones)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10, $11, $12)
          RETURNING id;
        `, [
          p.name, p.descripcion, p.precio, p.precio_costo, p.descuento, p.descuento_precio,
          p.destacado, p.stock, p.img_url, p.imagenes, marcaId, JSON.stringify(p.especificaciones)
        ]);
        prodId = insertRes.rows[0].id;
      }

      // Asociar producto a la categoría correspondiente
      if (categoriaId) {
        await client.query(`
          INSERT INTO producto_categoria (producto_id, categoria_id)
          VALUES ($1, $2)
          ON CONFLICT (producto_id, categoria_id) DO NOTHING;
        `, [prodId, categoriaId]);
      }

      productosInsertados++;
    }

    await client.query('COMMIT');
    console.log(`🎉 ¡Éxito! Se cargaron/actualizaron ${productosInsertados} productos del catálogo de MoliCell.`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error durante el seed del catálogo:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedTreintaCatalog();
