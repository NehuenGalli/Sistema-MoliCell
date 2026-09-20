const gastoToResponseDTO = (gasto) => gasto ? {
    id: gasto.id,
    categoria: gasto.categoria,
    descripcion: gasto.descripcion,
    monto: Number(gasto.monto) || 0,
    fecha: gasto.fecha,
    proveedor: gasto.proveedor,
    comprobante: gasto.comprobante,
    notas: gasto.notas,
    creado_en: gasto.creado_en,
    actualizado_en: gasto.actualizado_en
} : null;

module.exports = { gastoToResponseDTO };
