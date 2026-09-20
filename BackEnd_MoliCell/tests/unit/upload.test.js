const { detectarMimeImagen } = require('../../src/middlewares/uploadMiddleware');
require('../setup');

describe('validación binaria de imágenes', () => {
    it.each([
        ['jpeg', Buffer.from([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0]), 'image/jpeg'],
        ['png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]), 'image/png'],
        ['webp', Buffer.from('RIFF0000WEBP'), 'image/webp'],
        ['gif', Buffer.from('GIF89a000000'), 'image/gif'],
    ])('detecta %s por firma y no por extensión', (name, buffer, expected) => {
        expect(detectarMimeImagen(buffer)).toBe(expected);
    });

    it('rechaza buffers desconocidos o demasiado cortos', () => {
        expect(detectarMimeImagen(Buffer.from('not-an-image'))).toBeNull();
        expect(detectarMimeImagen(Buffer.from('x'))).toBeNull();
        expect(detectarMimeImagen('not-a-buffer')).toBeNull();
    });
});
