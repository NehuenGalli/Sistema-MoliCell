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

// Middleware Multer con límite de 5 MB y validación de tipo MIME
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Solo se permiten archivos de imagen (jpg, png, webp, gif)'), false);
        }
        cb(null, true);
    }
});

// 3. Función auxiliar para subir a Cloudinary bajo demanda
const subirACloudinary = async (fileBuffer, folder, mimetype = 'image/jpeg') => {
    try {
        if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: folder,
                        format: 'webp',
                        transformation: [
                            { width: 800, height: 800, crop: 'limit' },
                            { quality: 'auto' }
                        ]
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                uploadStream.end(fileBuffer);
            });
            return result.secure_url;
        }
    } catch (error) {
        console.warn('⚠️ Cloudinary no configurado o falló, generando Data URL local:', error.message);
    }

    return `data:${mimetype};base64,${fileBuffer.toString('base64')}`;
};

module.exports = {
    upload,
    subirACloudinary
};