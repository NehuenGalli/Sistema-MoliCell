const cloudinary = require('cloudinary').v2;
const multer = require('multer');
require('dotenv').config();

// 1. Configuración de credenciales de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Almacenamiento temporal en memoria
const storage = multer.memoryStorage();
const ALLOWED_IMAGE_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
]);

const detectarMimeImagen = (buffer) => {
    if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
    if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
    if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
    const gifHeader = buffer.subarray(0, 6).toString('ascii');
    if (gifHeader === 'GIF87a' || gifHeader === 'GIF89a') return 'image/gif';
    return null;
};

// Middleware Multer con límite de 5 MB y validación de tipo MIME
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 3 * 1024 * 1024,
        files: 10,
        fields: 25,
        parts: 35,
        fieldSize: 64 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
            return cb(new Error('Solo se permiten archivos de imagen (jpg, png, webp, gif)'), false);
        }
        cb(null, true);
    }
});

// 3. Función auxiliar para subir a Cloudinary bajo demanda
const subirACloudinary = async (fileBuffer, folder, mimetype = 'image/jpeg') => {
    const detectedMime = detectarMimeImagen(fileBuffer);
    if (!detectedMime || detectedMime !== mimetype) {
        const error = new Error('El contenido del archivo no coincide con una imagen permitida');
        error.status = 400;
        throw error;
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        const error = new Error('El servicio de almacenamiento de imágenes no está configurado');
        error.status = 503;
        throw error;
    }

    const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                format: 'webp',
                unique_filename: true,
                overwrite: false,
                transformation: [
                    { width: 800, height: 800, crop: 'limit' },
                    { quality: 'auto:good', fetch_format: 'webp' }
                ]
            },
            (error, uploadResult) => error ? reject(error) : resolve(uploadResult)
        );
        uploadStream.end(fileBuffer);
    });

    if (!result?.secure_url) throw new Error('El almacenamiento de imágenes no devolvió una URL segura');
    return result.secure_url;
};

module.exports = {
    upload,
    subirACloudinary,
    detectarMimeImagen,
    ALLOWED_IMAGE_MIME_TYPES
};
