const ventaToResponseDTO = (venta) => {
    if (!venta) return null;

    const productos = Array.isArray(venta.productos)
        ? venta.productos.map(p => ({
            producto_id: p.producto_id,
            name: p.name,
            precio: Number(p.precio) || 0,
            precio_costo: Number(p.precio_costo) || 0,
            cantidad: Number(p.cantidad) || 1
        }))
        : [];

    const monto = Number(venta.monto) || 0;
    const costo_total = productos.reduce((sum, p) => sum + ((Number(p.precio_costo) || 0) * (Number(p.cantidad) || 1)), 0);
    const ganancia = monto - costo_total;

    return {
        id: venta.id,
        codigo_venta: venta.codigo_venta || `VEN-${1000 + Number(venta.id)}`,
        monto,
        costo_total,
        ganancia,
        metodo_pago: venta.metodo_pago,
        fecha: venta.fecha,
        creado_en: venta.creado_en,
        productos
    };
};


module.exports = { ventaToResponseDTO };
