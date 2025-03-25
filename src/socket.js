import { Server } from 'socket.io'; // Importa Socket.io

export const createSocketServer = (server) => {
    const io = new Server(server, {
        cors: {
            origin: ['http://localhost:5173', 'https://ispsuite.app.la-net.co'],
            methods: ['GET', 'POST'],
            credentials: true,
        }
    });

    // Objeto para almacenar las relaciones entre userId y socketId
    let users = {};

    io.on('connection', (socket) => {
        console.log('Nuevo cliente conectado:', socket.id);

        // Registrar el usuario con su socket.id
        socket.on('registerUser', (userId) => {
            users[userId] = socket.id;
            console.log(`Usuario ${userId} registrado con socket ID ${socket.id}`);
        });

        // Manejar desconexión
        socket.on('disconnect', () => {
            console.log('Cliente desconectado:', socket.id);
            // Eliminar al usuario de la lista de usuarios registrados
            for (let userId in users) {
                if (users[userId] === socket.id) {
                    delete users[userId];
                    console.log(`Usuario ${userId} desconectado.`);
                    break;
                }
            }
        });

        // Emitir una notificación de bienvenida al usuario cuando se conecta
        socket.emit('notification', { message: 'Bienvenido a la aplicación..!' });

        // Evento para enviar mensaje e imagen al usuario
        socket.on('sendInvoiceMessage', ({ userId, message, imageUrl }) => {
            const recipientSocketId = users[userId];
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('invoiceMessage', {
                    message: message,
                    image: imageUrl
                });
                console.log('Factura enviada a', userId);
            } else {
                console.log('Usuario no conectado:', userId);
            }
        });
    });

    return io;
};
