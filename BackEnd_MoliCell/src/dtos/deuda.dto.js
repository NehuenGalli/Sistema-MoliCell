const pagoToResponseDTO = (pago) => pago ? {
    id: pago.id,
    deuda_id: pago.deuda_id,
    monto: Number(pago.monto) || 0,
    fecha: pago.fecha,
    notas: pago.notas,
    creado_en: pago.creado_en
} : null;

const deudaToResponseDTO = (deuda) => {
    if (!deuda) return null;
    const montoTotal = Number(deuda.monto_total) || 0;
    const montoPagado = Number(deuda.monto_pagado) || 0;
    return {
        id: deuda.id,
        persona_nombre: deuda.persona_nombre,
        telefono: deuda.telefono,
        concepto: deuda.concepto,
        origen: deuda.origen,
        referencia: deuda.referencia,
        monto_total: montoTotal,
        monto_pagado: montoPagado,
        saldo_pendiente: Math.max(0, montoTotal - montoPagado),
        fecha: deuda.fecha,
        vencimiento: deuda.vencimiento,
        estado: deuda.estado,
        notas: deuda.notas,
        creado_en: deuda.creado_en,
        actualizado_en: deuda.actualizado_en,
        pagos: Array.isArray(deuda.pagos) ? deuda.pagos.map(pagoToResponseDTO) : undefined
    };
};

module.exports = { deudaToResponseDTO, pagoToResponseDTO };
