import express from 'express';
import dotenv from 'dotenv';
import router from './routes/users.routes.js';
import cors from 'cors'; // Importa cors de manera consistente con ES6
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Server } from 'socket.io'; // Importa Socket.io

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

app.use('/uploads', express.static(join(__dirname, 'uploads')));
// Servir archivos estáticos desde un directorio específico, si es necesario
app.use(express.static(join(__dirname, 'public')));

app.use('/api', router);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Crear una instancia de Socket.io y asociarla al servidor
export const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'https://ispsuite.app.la-net.co'],
        methods: ['GET', 'POST'],
        credentials: true,
    }
});

// Escuchar conexiones de Socket.io
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);

    // Aquí puedes manejar eventos de Socket.io
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
    // Emitir una notificación de bienvenida al usuario cuando se conecta
    socket.emit('notification', { message: 'Bienvenido a la aplicación..!' });

    // Puedes agregar más eventos según tus necesidades
});
