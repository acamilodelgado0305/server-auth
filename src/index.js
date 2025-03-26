import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './routes/users.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import { createSocketServer } from './socket.js';

dotenv.config();

const app = express();

// Middleware para parsear el cuerpo de las peticiones JSON
app.use(express.json());

// Configuración de CORS (para aceptar peticiones de tu frontend)
app.use(cors({
    origin: ['http://localhost:5173', 'https://ispsuite.app.la-net.co', 'https://ispsuitedev.app.la-net.co'],
    credentials: true,
}));

// Usamos las rutas de usuarios y notificaciones
app.use('/api/', userRoutes);
app.use('/api/notifications', notificationsRoutes);

// Servir archivos estáticos si es necesario
// Asegúrate de configurar correctamente el directorio de archivos estáticos si lo necesitas
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// Crear el servidor HTTP
const server = http.createServer(app);

// Crear la instancia de Socket.io usando la función 'createSocketServer' y asociarla al servidor HTTP
const io = createSocketServer(server);

// Inicia el servidor HTTP
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor en ejecución en el puerto ${PORT}`);
});

// Exportar la instancia de io para usarla en otros archivos si es necesario
export { io };
