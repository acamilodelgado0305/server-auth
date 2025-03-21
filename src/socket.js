// socket.js
import { Server } from 'socket.io'; // Importa Socket.io

export const createSocketServer = (server) => {
    // Crear una instancia de Socket.io y asociarla al servidor
    const io = new Server(server, {
        cors: {
            origin: ['http://localhost:5173', 'https://ispsuite.app.la-net.co'],
            methods: ['GET', 'POST'],
            credentials: true,
        }
    });

    // Escuchar conexiones de Socket.io
    io.on('connection', (socket) => {
        console.log('Nuevo cliente conectado:', socket.id);

        // Manejar desconexión
        socket.on('disconnect', () => {
            console.log('Cliente desconectado:', socket.id);
        });

        // Emitir una notificación de bienvenida al usuario cuando se conecta
        socket.emit('notification', { message: 'Bienvenido a la aplicación..!' });

        // Evento para enviar mensaje e imagen al usuario
        socket.on('sendInvoiceMessage', ({ userId, message, imageUrl }) => {
            // Verifica si el usuario está conectado y luego emite el evento
            io.to(userId).emit('invoiceMessage', {
                message: message,
                image: imageUrl
            });
        });
    });

    return io;
};
