// server.js
import express from 'express';
import dotenv from 'dotenv';
import router from './routes/users.routes.js';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createSocketServer } from './socket.js';

dotenv.config();

const app = express();
app.use(express.json());

// Obtener __filename y __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configura CORS antes de tus rutas
app.use(cors({
    origin: ['http://localhost:5173', 'https://ispsuite.app.la-net.co', 'https://ispsuitedev.app.la-net.co'],
    credentials: true,
}));

app.use('/uploads', express.static(join(__dirname, '../uploads')));
// Servir archivos estáticos desde un directorio específico, si es necesario
app.use(express.static(join(__dirname, 'public')));

app.use('/api', router);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Llama a la función para crear la instancia de Socket.io
createSocketServer(server);
