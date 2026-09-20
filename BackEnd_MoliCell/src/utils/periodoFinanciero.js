const businessError = (message) => {
    const error = new Error(message);
    error.status = 400;
    return error;
};

const parseDate = (value, fieldName) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    if (!match) throw businessError(`${fieldName} debe tener formato YYYY-MM-DD.`);
    const [, year, month, day] = match.map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        throw businessError(`${fieldName} no es una fecha válida.`);
    }
    return date;
};

const formatDate = (date) => date.toISOString().slice(0, 10);

const todayInBuenosAires = (now = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(now).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
    return `${parts.year}-${parts.month}-${parts.day}`;
};

const obtenerRangoFinanciero = (params = {}, now = new Date()) => {
    const periodo = params.periodo || 'mes';
    const hoy = todayInBuenosAires(now);

    if (periodo === 'personalizado') {
        const desdeDate = parseDate(params.desde, 'desde');
        const hastaDate = parseDate(params.hasta, 'hasta');
        if (desdeDate > hastaDate) throw businessError('La fecha desde no puede ser posterior a la fecha hasta.');
        const days = Math.round((hastaDate - desdeDate) / 86400000);
        if (days > 3660) throw businessError('El rango consultado no puede superar diez años.');
        return { desde: formatDate(desdeDate), hasta: formatDate(hastaDate), periodo };
    }

    if (periodo === 'dia') {
        const fecha = formatDate(parseDate(params.fecha || hoy, 'fecha'));
        return { desde: fecha, hasta: fecha, periodo };
    }

    if (periodo === 'semana') {
        const anchor = parseDate(params.fecha || hoy, 'fecha');
        const day = anchor.getUTCDay() || 7;
        const desde = new Date(anchor);
        desde.setUTCDate(anchor.getUTCDate() - day + 1);
        const hasta = new Date(desde);
        hasta.setUTCDate(desde.getUTCDate() + 6);
        return { desde: formatDate(desde), hasta: formatDate(hasta), periodo };
    }

    if (periodo !== 'mes') throw businessError('El período solicitado no es válido.');
    const monthMatch = /^(\d{4})-(\d{2})$/.exec(params.mes || hoy.slice(0, 7));
    if (!monthMatch) throw businessError('mes debe tener formato YYYY-MM.');
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    if (month < 1 || month > 12) throw businessError('mes no es válido.');
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return {
        desde: `${year}-${String(month).padStart(2, '0')}-01`,
        hasta: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
        periodo
    };
};

module.exports = { obtenerRangoFinanciero, todayInBuenosAires };
