// DTO de Salida: Transforma la entidad de la BD en lo que recibirá el cliente
const toUsuarioResponseDTO = (user) => {
    if (!user) return null;
    return {
        id: user.id,
        email: user.email,
        creadoEn: user.creado_en
    };
};

module.exports = {
    toUsuarioResponseDTO
};