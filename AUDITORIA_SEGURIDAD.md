# Auditoría integral de MoliCell

Fecha: 20 de septiembre de 2026
Rama: `dev`
Alcance: API Express/PostgreSQL, frontend React/Vite y agente local de impresión térmica para Windows.

## Resultado ejecutivo

La auditoría encontró y corrigió riesgos de autenticación, autorización, manipulación de ventas, concurrencia de stock, carga de archivos, exposición de errores, dependencias vulnerables y abuso del agente local. También redujo llamadas redundantes, memoria transitoria, peso de recursos y JavaScript inicial.

El estado final verificable es:

- 0 vulnerabilidades conocidas en `npm audit` para los tres proyectos.
- 191 pruebas automatizadas aprobadas: 133 backend, 51 frontend y 7 agente térmico.
- Umbrales mínimos de cobertura ejecutables en CI para los tres proyectos.
- Lint y build de producción del frontend aprobados.
- Ejecutable Windows del agente térmico reconstruido con la implementación reforzada.
- `git diff --check` sin errores de formato.
- No se encontraron secretos reales versionados; los valores de `.env.example` son marcadores.

## Hallazgos críticos y correcciones

### Autenticación y autorización

- El JWT dejó de persistirse en `localStorage`. La sesión administrativa usa una cookie `HttpOnly`, `Secure` en producción y `SameSite` configurable.
- Se agregó protección CSRF para mutaciones autenticadas por cookie, restauración segura de sesión y cierre de sesión en el servidor.
- Los JWT ahora restringen algoritmo, emisor y audiencia e incluyen `jti`; el secreto debe tener al menos 32 caracteres en producción.
- El login ejecuta bcrypt incluso para correos inexistentes, reduciendo la enumeración por diferencias de tiempo.
- Todas las operaciones administrativas verifican explícitamente el rol `admin`.
- Se mantienen tokens Bearer sólo como compatibilidad transitoria; producción no devuelve el token a JavaScript salvo que se active deliberadamente `EXPOSE_AUTH_TOKEN=true`.

### Ventas, stock y consistencia

- El monto enviado por el cliente ya no es confiable: el backend recalcula el total usando precios vigentes de la base.
- La creación de ventas bloquea productos con `SELECT ... FOR UPDATE`, valida existencia, estado y stock, y actualiza todo dentro de una transacción.
- Los identificadores se ordenan antes del bloqueo y PostgreSQL aplica `ORDER BY id FOR UPDATE`, garantizando el orden de adquisición de locks.
- Los productos duplicados se consolidan defensivamente y la validación limita cada venta a 100 productos únicos.
- La eliminación de ventas repone stock dentro de una única transacción.
- Todos los identificadores de URL se validan como enteros positivos antes de consultar PostgreSQL.

### Superficie HTTP y datos

- Se agregó Helmet, CORS por lista exacta, límites globales, rate limiting, errores públicos sanitizados, 404 uniforme y desactivación de `X-Powered-By`.
- Los esquemas Joi ahora limitan longitudes, arreglos, estados, URLs HTTPS y campos editables.
- La consulta pública de productos no expone `precio_costo` ni productos inactivos.
- PostgreSQL usa parámetros para todos los valores externos, TLS verificable por defecto en producción y timeouts de conexión/consulta.
- Se agregaron índices para catálogo, stock, reparaciones y ventas mediante una migración idempotente.
- El rate limiter se ejecuta antes de CORS y del parser JSON, por lo que también contabiliza solicitudes rechazadas tempranamente.
- Las cookies con codificación inválida se tratan como sesiones no válidas y no generan errores 500.

### Archivos e impacto en memoria

- Las cargas están limitadas a 3 MiB por archivo, 10 archivos y 35 partes por solicitud.
- Se valida tanto el MIME declarado como la firma binaria JPEG, PNG, WebP o GIF.
- Las imágenes se suben en paralelo a Cloudinary y se convierten a WebP; se eliminó el fallback que persistía Base64 en PostgreSQL.
- Si Cloudinary no está configurado, la API falla de forma explícita y no infla la base ni la memoria de proceso.

### Agente térmico local

- El servidor escucha sólo en `127.0.0.1`, valida orígenes exactos, limita el cuerpo a 32 KiB y exige JSON.
- La web ya no puede seleccionar una impresora arbitraria; sólo se usa la impresora configurada o una detección local controlada.
- PowerShell se ejecuta con `execFile`, argumentos fijos, script codificado, timeout y límite de salida.
- Se agregaron rate limiting, deduplicación de tickets y poda de estructuras en memoria.
- Se reemplazó el empaquetador vulnerable/deprecado `pkg` por `@yao-pkg/pkg` y se reconstruyó el `.exe`.

## Optimización y llamadas a la API

- El dashboard pasó de descargar colecciones completas mediante tres solicitudes a consumir un único endpoint agregado con una consulta SQL acotada.
- Las rutas administrativas ya no cargan el catálogo público ni categorías innecesariamente.
- Las lecturas GET usan caché breve e in-flight deduplication, evitando duplicados de React StrictMode y navegaciones cercanas.
- La búsqueda de productos para ventas se mantiene paginada/acotada y con debounce.
- Se agregaron límites de 200 productos públicos, 500 administrativos y 100 ventas por página.
- Las rutas pesadas se cargan con `React.lazy`.
- JavaScript inicial: 474,62 kB → 322,02 kB, una reducción aproximada del 32 %.
- JavaScript inicial comprimido: 138,41 kB → 105,91 kB, una reducción aproximada del 23 %.
- Seis PNG sumaban aproximadamente 7,96 MB; sus WebP suman 330,59 kB, una reducción aproximada del 96 %.

## Cobertura automatizada

Los reportes instrumentan el código de aplicación y los comandos fallan si la cobertura baja de los mínimos configurados.

- Backend: 83,18 % statements, 62,97 % branches, 87,17 % functions y 84,42 % lines. Umbral: 80/60/85/80.
- Frontend: 67,95 % statements, 52,66 % branches, 57,09 % functions y 71,99 % lines. Umbral: 65/50/55/70.
- Agente térmico (`agent.js`): 67,88 % lines, 70,00 % branches y 82,61 % functions. Umbral: 65/65/80.

La cobertura incluye seguridad HTTP, cookies/CSRF, roles, límites de payload, ventas y concurrencia lógica, dashboard, DTOs, firmas de imágenes, servicios, caché, sesión administrativa, rutas públicas/protegidas, CRUD del panel, carrito, WhatsApp, catálogo, navegación e impresión.

La expresión “cobertura total” se implementó como medición de todo el código fuente y pruebas de todos los subsistemas principales, no como una cifra artificial de 100 %. Los handlers visuales de cámara, impresión física y combinaciones excepcionales de páginas administrativas conservan cobertura parcial; los umbrales evitan regresiones y dejan visible esa deuda.

## Segunda revisión independiente

Una revisión especializada adicional detectó cuatro observaciones y todas quedaron cerradas antes de finalizar:

- El cierre de sesión ahora espera la confirmación del servidor, conserva el panel si falla y muestra el error para reintentar.
- El rate limiter se movió delante de CORS y del parser de cuerpos.
- Las cookies mal codificadas dejan de producir respuestas 500.
- Los locks de productos en ventas usan orden SQL explícito.

## Correcciones de regresión posteriores

- Los estilos de las páginas protegidas se agruparon con el layout administrativo y se cargan en un orden fijo. Esto evita que selectores compartidos se sobrescriban según el orden en que se visitan las secciones.
- Cada página diferida tiene ahora un límite de carga propio, por lo que la navegación mantiene visible y estilizado el layout administrativo mientras llega el código de la sección.
- El alta y la edición de reparaciones dejaron de enviar `codigo_seguimiento`. El backend genera el código seguro al crear y conserva el existente al editar, manteniendo alineados el formulario y la validación reforzada.

## Riesgos residuales y próximos pasos

- El rate limiter del backend vive en memoria. Si se despliegan varias réplicas, debe migrarse a un store compartido como Redis.
- Los listados de productos tienen límites duros, pero no paginación completa. Conviene agregar cursores o `page/limit` cuando el catálogo supere algunos cientos de registros.
- Si Cloudinary acepta archivos y luego falla la transacción SQL, pueden quedar recursos huérfanos. La siguiente mejora es persistir `public_id` y ejecutar compensación automática.
- El ejecutable de Windows fue reconstruido pero no firmado. Para distribución externa debe firmarse con un certificado de code signing y publicar checksum.
- El agente local confía en CORS/origen y en el aislamiento de loopback; para equipos compartidos de alto riesgo puede añadirse emparejamiento con secreto rotatorio.
- La compatibilidad Bearer debería retirarse cuando no existan clientes externos que dependan de ella.
- No se ejecutaron pruebas con una impresora física ni pruebas de carga distribuidas; sí se probaron protocolo HTTP, límites y generación ESC/POS.

## Despliegue seguro

1. Revisar `BackEnd_MoliCell/.env.example` y configurar secretos reales fuera de Git.
2. Usar `JWT_SECRET` aleatorio de al menos 32 caracteres.
3. Definir `FRONTEND_ORIGINS` con orígenes HTTPS exactos.
4. Mantener `DATABASE_SSL_REJECT_UNAUTHORIZED=true`; sólo desactivarlo ante una CA privada gestionada explícitamente.
5. Configurar Cloudinary y dejar `EXPOSE_AUTH_TOKEN=false`.
6. Si frontend y API son cross-site, configurar `AUTH_COOKIE_SAME_SITE=none` y servir ambos por HTTPS.
7. Ejecutar `npm run migrate:audit` dentro de `BackEnd_MoliCell` antes de desplegar la nueva API.
8. Ejecutar las verificaciones de la siguiente sección en CI.

## Comandos de verificación

```powershell
Set-Location BackEnd_MoliCell
npm audit --audit-level=low
npm run test:coverage

Set-Location ..\FrontEnd_MoliCell
npm audit --audit-level=low
npm run lint
npm run build
npm run test:coverage

Set-Location ..\ThermalPrintAgent
npm audit --audit-level=low
npm run test:coverage
npm run build:windows
```
