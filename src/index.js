import express from 'express';
import dotenv from 'dotenv';
import router from './routes/users.routes.js';
import cors from 'cors'; // Importa cors de manera consistente con ES6
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const app = express();
app.use(express.json());

// Obtener __filename y __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configura CORS antes de tus rutas
app.use(cors({
    origin: ['http://localhost:5173', 'https://ispsuite.app.la-net.co'],
    credentials: true,
}));

// Servir archivos estáticos desde un directorio específico, si es necesario
app.use(express.static(join(__dirname, 'public')));

app.use('/api', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
