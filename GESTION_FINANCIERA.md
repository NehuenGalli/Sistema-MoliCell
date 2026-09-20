# Gestión financiera

## Alcance

El panel administrativo incorpora tres módulos relacionados:

- **Gastos:** alta, edición, eliminación, búsqueda y consulta por día, semana, mes o rango personalizado.
- **Deudores:** registro de personas, origen y referencia de la deuda, vencimiento, saldo y pagos parciales.
- **Ganancias:** resultado neto del período con el detalle que explica cada importe.

La vista principal de cada módulo usa el mes actual. El administrador puede consultar períodos anteriores sin descargar todos los registros a memoria: los filtros, sumas y límites se aplican en PostgreSQL.

## Cálculo de ganancias

El reporte usa la siguiente fórmula:

```text
ingresos = ventas + servicios reconocidos + cobros de deudas
egresos  = costo histórico de productos + gastos + deudas generadas
ganancia neta = ingresos - egresos
```

- Una venta usa el precio y el costo guardados al vender, aunque luego cambie el producto.
- Una venta en efectivo recibe un 15 % de descuento calculado por el backend. Se guardan subtotal, porcentaje, descuento y total final, y los mismos valores aparecen en el ticket.
- Un servicio se reconoce una sola vez, al entrar por primera vez en `Listo` o `Entregado`. Volver a cambiar el estado no altera esa fecha ni duplica el ingreso.
- Las órdenes que ya estaban `Listo` o `Entregado` antes de migrar se reconocen en su fecha de creación.
- Una deuda se descuenta en la fecha en que se registra. Cada pago vuelve a ingresar en la fecha del cobro.

Cada sección detallada del reporte devuelve como máximo 200 movimientos. Los totales siempre contemplan el período completo.

## Seguridad y consistencia

- Todos los endpoints de gastos, deudas y ganancias requieren una sesión de administrador.
- Los cuerpos, parámetros y fechas se validan antes de acceder a la base.
- Los pagos se registran dentro de una transacción y bloquean la deuda para impedir sobrepagos concurrentes.
- Los totales de ventas y el descuento se calculan en el servidor; no se confía en montos enviados por el navegador.
- Los listados están paginados y las consultas financieras usan índices por fecha.

## Despliegue

Para una base existente, desde `BackEnd_MoliCell`:

```bash
npm run migrate:audit
npm run migrate:gestion
```

`migrate:gestion` es idempotente y debe ejecutarse antes de publicar el frontend nuevo. Una instalación desde cero puede usar `npm run init-db`.

## Verificación

```bash
cd BackEnd_MoliCell
npm test
npm run test:coverage

cd ../FrontEnd_MoliCell
npm test
npm run test:coverage
npm run lint
npm run build
```

La carpeta `ThermalPrintAgent` no forma parte de estos cambios y no debe incluirse como artefacto de despliegue; el agente se entrega al cliente por separado.
