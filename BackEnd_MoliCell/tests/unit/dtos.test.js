const { toProductoAdminDTO, toProductoPublicoDTO } = require('../../src/dtos/producto.dto');
const { servicioTecnicoPublicoDTO, servicioTecnicoToResponseDTO } = require('../../src/dtos/servicoTecnico.dto');
const { ventaToResponseDTO } = require('../../src/dtos/venta.dto');
require('../setup');

describe('DTOs de salida', () => {
    it('no filtra precio de costo al catálogo público y sí lo expone al admin', () => {
        const producto = { id: 1, name: 'A', precio: '100', precio_costo: '40', stock: 1, img_url: 'https://x/y', categorias: ['Cat'] };
        expect(toProductoPublicoDTO(producto)).not.toHaveProperty('precio_costo');
        expect(toProductoAdminDTO(producto).precio_costo).toBe(40);
        expect(toProductoPublicoDTO(producto).imagenes).toEqual(['https://x/y']);
        expect(toProductoPublicoDTO(null)).toBeNull();
    });

    it('calcula costo y ganancia de una venta', () => {
        const dto = ventaToResponseDTO({
            id: 2,
            monto: '1000',
            productos: [{ producto_id: 1, precio: '1000', precio_costo: '250', cantidad: 2 }]
        });
        expect(dto.costo_total).toBe(500);
        expect(dto.ganancia).toBe(500);
        expect(dto.codigo_venta).toBe('VEN-1002');
        expect(ventaToResponseDTO(null)).toBeNull();
    });

    it('separa la vista pública del servicio técnico', () => {
        const source = { id: 1, codigo_seguimiento: 'MC-ABC123', cliente_nombre: 'Ana', dispositivo: 'A', estado: 'Pendiente' };
        expect(servicioTecnicoPublicoDTO(source)).not.toHaveProperty('cliente_nombre');
        expect(servicioTecnicoToResponseDTO(source).cliente_nombre).toBe('Ana');
        expect(servicioTecnicoPublicoDTO(null)).toBeNull();
    });
});
