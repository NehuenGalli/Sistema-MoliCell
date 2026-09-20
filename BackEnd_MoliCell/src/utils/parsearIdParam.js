const parsearIdParam = (valor) => {
    const id = Number(valor);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
};

module.exports = parsearIdParam;
