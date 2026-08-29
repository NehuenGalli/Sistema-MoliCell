/**
 * Mock de la función subirACloudinary.
 * Devuelve una URL falsa predecible sin hacer llamadas reales a internet.
 */
const subirACloudinaryMock = jest.fn().mockResolvedValue({
    secure_url: 'https://res.cloudinary.com/test/image/upload/v1/molicell_productos/mock_image.webp',
    public_id: 'molicell_productos/mock_image',
    format: 'webp',
    width: 800,
    height: 800
});

module.exports = { subirACloudinaryMock };
