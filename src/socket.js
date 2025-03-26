import { Server } from 'socket.io';

export const createSocketServer = (server) => {
    const io = new Server(server, {
        cors: {
            origin: ['http://localhost:5173', 'https://ispsuite.app.la-net.co'],
            methods: ['GET', 'POST'],
            credentials: true,
        }
    });

    // Manejo de eventos de conexión
    io.on('connection', (socket) => {
        console.log('Nuevo cliente conectado:', socket.id);

        // Manejar desconexión
        socket.on('disconnect', () => {
            console.log('Cliente desconectado:', socket.id);
        });

        // Emitir una notificación de bienvenida al usuario cuando se conecta
        socket.emit('notification', { message: 'Bienvenido a la aplicación..!' });

        // Manejar el evento 'sendInvoiceMessage'
        socket.on('sendInvoiceMessage', (data) => {
            // Log para verificar que el evento y los datos se están recibiendo
            console.log("Evento 'sendInvoiceMessage' recibido con los siguientes datos:", data);

            // Aquí puedes agregar más lógica para manejar la recepción del mensaje, como enviarlo a otro usuario
            io.to(data.userId).emit('invoiceMessage', {
                message: data.message,
                image: data.imageUrl
            });
        });

    });

    return io;
};
