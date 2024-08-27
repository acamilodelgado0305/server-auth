// src/multerConfig.js

import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obtener el directorio del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurar multer para almacenar archivos en la carpeta uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, join(__dirname, '../uploads')); // Ruta a la carpeta uploads
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Nombre único para el archivo
    }
});

const upload = multer({ storage });
export default upload;
