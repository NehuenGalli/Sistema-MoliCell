const { obtenerRangoFinanciero, todayInBuenosAires } = require('../../src/utils/periodoFinanciero');

describe('periodoFinanciero', () => {
    const now = new Date('2026-09-20T15:00:00.000Z');

    test('resuelve el mes actual por defecto', () => {
        expect(obtenerRangoFinanciero({}, now)).toEqual({ desde: '2026-09-01', hasta: '2026-09-30', periodo: 'mes' });
    });

    test('resuelve día, semana de lunes a domingo y febrero bisiesto', () => {
        expect(obtenerRangoFinanciero({ periodo: 'dia', fecha: '2026-09-18' }, now)).toEqual({ desde: '2026-09-18', hasta: '2026-09-18', periodo: 'dia' });
        expect(obtenerRangoFinanciero({ periodo: 'semana', fecha: '2026-09-20' }, now)).toEqual({ desde: '2026-09-14', hasta: '2026-09-20', periodo: 'semana' });
        expect(obtenerRangoFinanciero({ periodo: 'mes', mes: '2028-02' }, now)).toEqual({ desde: '2028-02-01', hasta: '2028-02-29', periodo: 'mes' });
    });

    test('valida rangos personalizados e inputs inválidos', () => {
        expect(obtenerRangoFinanciero({ periodo: 'personalizado', desde: '2026-01-02', hasta: '2026-01-10' }, now)).toEqual({ desde: '2026-01-02', hasta: '2026-01-10', periodo: 'personalizado' });
        expect(() => obtenerRangoFinanciero({ periodo: 'personalizado', desde: '2026-02-10', hasta: '2026-01-01' }, now)).toThrow(/posterior/);
        expect(() => obtenerRangoFinanciero({ periodo: 'dia', fecha: '2026-02-30' }, now)).toThrow(/válida/);
        expect(() => obtenerRangoFinanciero({ periodo: 'otro' }, now)).toThrow(/período/);
    });

    test('calcula la fecha actual en Buenos Aires', () => {
        expect(todayInBuenosAires(new Date('2026-09-20T02:00:00.000Z'))).toBe('2026-09-19');
    });
});
