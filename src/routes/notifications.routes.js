import { Router } from 'express';
import { authenticateToken } from '../middlewares/authenticateToken.js';  // Middleware de autenticación
import {
    saveNotification,
    markNotificationAsRead,
    getUnreadNotifications
} from '../controllers/notifications.Controller.js';  // Importa correctamente el controlador desde la carpeta controllers

const router = Router();

// Ruta para guardar una nueva notificación
router.post('/', async (req, res) => {
    const { userId, message, imageUrl } = req.body;
    try {
        const newNotification = await saveNotification(userId, message, imageUrl);
        res.status(201).json(newNotification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Ruta para marcar la notificación como leída
router.put('/:id/read', async (req, res) => {
    const { id } = req.params;
    try {
        const updatedNotification = await markNotificationAsRead(id);
        res.status(200).json(updatedNotification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Ruta para obtener las notificaciones no leídas de un usuario
router.get('/unread/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const notifications = await getUnreadNotifications(userId);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
