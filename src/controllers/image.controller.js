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


// Configuración de Multer para recibir archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Aquí aseguramos que la carpeta 'uploads' exista
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);  // Especificamos la carpeta donde se almacenarán los archivos
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);  // Generamos un nombre único para cada archivo
    }
});

// Inicialización del middleware Multer con la configuración anterior
const upload = multer({ storage });

// Middleware para recibir un solo archivo
export const uploadFileToServer = upload.single('myFile');  // 'myFile' es el campo que enviará el cliente

export const uploadFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    // Aquí podrías hacer algo con el archivo, como almacenarlo en base de datos, etc.
    const fileUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;  // Generamos la URL del archivo
    res.status(200).json({ fileUrl });
};