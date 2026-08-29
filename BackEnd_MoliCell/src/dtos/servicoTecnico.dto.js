// DTO completo para respuestas al Admin
const servicioTecnicoToResponseDTO = (servicioTecnico) => {
    if (!servicioTecnico) return null;
    return {
        id: servicioTecnico.id,
        codigo_seguimiento: servicioTecnico.codigo_seguimiento,
        cliente_nombre: servicioTecnico.cliente_nombre,
        cliente_telefono: servicioTecnico.cliente_telefono,
        dispositivo: servicioTecnico.dispositivo,
        falla_descripcion: servicioTecnico.falla_descripcion,
        presupuesto_estimado: servicioTecnico.presupuesto_estimado,
        estado: servicioTecnico.estado,
        creado_en: servicioTecnico.creado_en
    };
};

// DTO público restringido para consultas de Clientes (sin datos personales)
const servicioTecnicoPublicoDTO = (servicioTecnico) => {
    if (!servicioTecnico) return null;
    return {
        codigo_seguimiento: servicioTecnico.codigo_seguimiento,
        dispositivo: servicioTecnico.dispositivo,
        falla_descripcion: servicioTecnico.falla_descripcion,
        estado: servicioTecnico.estado,
        creado_en: servicioTecnico.creado_en
    };
};

module.exports = { servicioTecnicoToResponseDTO, servicioTecnicoPublicoDTO };
