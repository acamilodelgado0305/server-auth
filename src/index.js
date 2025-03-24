import express from 'express';
import http from 'http';
import { createSocketServer } from './socket.js';  // Importamos la función de socket
import userRoutes from './routes/users.routes.js';  // Asegúrate de que esta ruta exista
import notificationsRoutes from './routes/notifications.routes.js';  // Asegúrate de que esta ruta exista

const app = express();
const server = http.createServer(app);  // Crea el servidor HTTP

// Middleware para parsear el cuerpo de las peticiones JSON
app.use(express.json());  // Asegúrate de que Express pueda procesar el cuerpo de la solicitud como JSON

// Inicia el servidor de WebSocket
const io = createSocketServer(server);  // Guarda la instancia de io

// Usamos las rutas de usuarios y notificaciones
app.use('/api/users', userRoutes);  // Rutas para manejar usuarios
app.use('/api/notifications', notificationsRoutes);  // Rutas para manejar notificaciones

// Inicia el servidor HTTP
server.listen(3000, () => {
    console.log('Servidor en ejecución en el puerto 3000');
});

// Exportar io para usarlo en otros archivos
export { io };
