const ventaToResponseDTO = (venta) => {
    if (!venta) return null;
    return {
        id: venta.id,
        codigo_venta: venta.codigo_venta || `VEN-${1000 + Number(venta.id)}`,
        monto: Number(venta.monto),
        metodo_pago: venta.metodo_pago,
        fecha: venta.fecha,
        creado_en: venta.creado_en,
        productos: venta.productos || []
    };
};


module.exports = { ventaToResponseDTO };
