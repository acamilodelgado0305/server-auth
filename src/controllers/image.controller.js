// src/controllers/image.controller.js

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { cloudinary } from '../cloudinaryConfig.js'; // Asegúrate de que la ruta sea correcta
import multer from 'multer';
import path from 'path';

// Obtener el directorio del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const uploadImageToCloudinary = async (req, res) => {
    try {
        const { file } = req;
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Ruta del archivo temporal
        const filePath = join(__dirname, '../../uploads', file.filename);

        // Subir imagen a Cloudinary
        const result = await cloudinary.uploader.upload(filePath);

        // Elimina el archivo temporal después de subirlo
        fs.unlinkSync(filePath);

        res.status(200).json({ url: result.secure_url });
    } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        res.status(500).json({ error: error.message });
    }
};


// Configuración de multer para recibir archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');  // Asegúrate de que esta carpeta exista
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });


export const uploadFileToServer = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Aquí procesas el archivo
        const filePath = path.join(__dirname, 'uploads', req.file.filename);

        // Devuelves la URL del archivo subido
        const fileUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;
        return res.status(200).json({ fileUrl });
    } catch (error) {
        console.error('Error uploading file:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};