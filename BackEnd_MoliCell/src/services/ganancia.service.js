const pool = require('../config/db');
const { obtenerRangoFinanciero } = require('../utils/periodoFinanciero');

const toNumber = (value) => Number(value) || 0;

const obtenerGanancias = async (params = {}) => {
    const rango = obtenerRangoFinanciero(params);
    const result = await pool.query(`
        WITH ventas_periodo AS (
            SELECT v.id, v.codigo_venta, v.fecha, v.metodo_pago, v.subtotal, v.descuento_monto, v.monto,
                   COALESCE(SUM(vd.costo_unitario * vd.cantidad), 0) AS costo_productos
            FROM venta v
            LEFT JOIN venta_detalle vd ON vd.venta_id = v.id
            WHERE v.fecha BETWEEN $1::date AND $2::date
            GROUP BY v.id
        ), servicios_periodo AS (
            SELECT id, codigo_seguimiento, cliente_nombre, dispositivo, presupuesto_estimado,
                   fecha_reconocimiento, estado
            FROM servicio_tecnico
            WHERE fecha_reconocimiento >= (($1::date)::timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires')
              AND fecha_reconocimiento < ((($2::date + 1))::timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires')
        ), gastos_periodo AS (
            SELECT id, fecha, categoria, descripcion, proveedor, monto
            FROM gasto WHERE fecha BETWEEN $1::date AND $2::date
        ), deudas_periodo AS (
            SELECT d.id, d.fecha, d.persona_nombre, d.concepto, d.origen, d.referencia, d.monto_total,
                   COALESCE((SELECT SUM(dp.monto) FROM deuda_pago dp WHERE dp.deuda_id = d.id), 0) AS monto_pagado
            FROM deuda d WHERE d.fecha BETWEEN $1::date AND $2::date
        ), cobros_periodo AS (
            SELECT dp.id, dp.fecha, dp.monto, dp.notas, d.id AS deuda_id, d.persona_nombre, d.concepto
            FROM deuda_pago dp JOIN deuda d ON d.id = dp.deuda_id
            WHERE dp.fecha BETWEEN $1::date AND $2::date
        )
        SELECT
            COALESCE((SELECT SUM(monto) FROM ventas_periodo),0) AS ingresos_ventas,
            COALESCE((SELECT SUM(costo_productos) FROM ventas_periodo),0) AS costo_productos,
            COALESCE((SELECT SUM(presupuesto_estimado) FROM servicios_periodo),0) AS ingresos_servicios,
            COALESCE((SELECT SUM(monto) FROM gastos_periodo),0) AS gastos,
            COALESCE((SELECT SUM(monto_total) FROM deudas_periodo),0) AS deudas_generadas,
            COALESCE((SELECT SUM(monto) FROM cobros_periodo),0) AS cobros_deudas,
            COALESCE((SELECT json_agg(x ORDER BY x.fecha DESC, x.id DESC) FROM (SELECT * FROM ventas_periodo ORDER BY fecha DESC, id DESC LIMIT 200) x),'[]'::json) AS ventas,
            COALESCE((SELECT json_agg(x ORDER BY x.fecha_reconocimiento DESC, x.id DESC) FROM (SELECT * FROM servicios_periodo ORDER BY fecha_reconocimiento DESC, id DESC LIMIT 200) x),'[]'::json) AS servicios,
            COALESCE((SELECT json_agg(x ORDER BY x.fecha DESC, x.id DESC) FROM (SELECT * FROM gastos_periodo ORDER BY fecha DESC, id DESC LIMIT 200) x),'[]'::json) AS detalle_gastos,
            COALESCE((SELECT json_agg(x ORDER BY x.fecha DESC, x.id DESC) FROM (SELECT * FROM deudas_periodo ORDER BY fecha DESC, id DESC LIMIT 200) x),'[]'::json) AS deudas,
            COALESCE((SELECT json_agg(x ORDER BY x.fecha DESC, x.id DESC) FROM (SELECT * FROM cobros_periodo ORDER BY fecha DESC, id DESC LIMIT 200) x),'[]'::json) AS cobros;
    `, [rango.desde, rango.hasta]);

    const row = result.rows[0];
    const ingresosVentas = toNumber(row.ingresos_ventas);
    const ingresosServicios = toNumber(row.ingresos_servicios);
    const cobrosDeudas = toNumber(row.cobros_deudas);
    const costoProductos = toNumber(row.costo_productos);
    const gastos = toNumber(row.gastos);
    const deudasGeneradas = toNumber(row.deudas_generadas);
    const ingresosTotales = ingresosVentas + ingresosServicios + cobrosDeudas;
    const egresosTotales = costoProductos + gastos + deudasGeneradas;

    return {
        resumen: {
            ...rango,
            ingresos_ventas: ingresosVentas,
            ingresos_servicios: ingresosServicios,
            cobros_deudas: cobrosDeudas,
            ingresos_totales: ingresosTotales,
            costo_productos: costoProductos,
            gastos,
            deudas_generadas: deudasGeneradas,
            egresos_totales: egresosTotales,
            ganancia_neta: ingresosTotales - egresosTotales
        },
        detalle: {
            ventas: row.ventas || [],
            servicios: row.servicios || [],
            gastos: row.detalle_gastos || [],
            deudas: row.deudas || [],
            cobros: row.cobros || [],
            limite_por_seccion: 200
        }
    };
};

module.exports = { obtenerGanancias };
