import { pool } from '../db.js';

// Función para guardar la notificación en la base de datos
export const saveNotification = async (userId, message, imageUrl) => {
    try {
        const query = `
    INSERT INTO notifications (user_id, message, image_url, status, created_at, updated_at)
    VALUES ($1, $2, $3, 'unread', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
    RETURNING *;
`;
        const { rows } = await pool.query(query, [userId, message, imageUrl]);
        return rows[0];
    } catch (error) {
        console.error('Error saving notification:', error);
        throw new Error('Error saving notification');
    }
};

// Función para marcar la notificación como leída
export const markNotificationAsRead = async (notificationId) => {
    try {
        const query = `
      UPDATE notifications 
      SET status = 'read', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 RETURNING *;
    `;
        const { rows } = await pool.query(query, [notificationId]);
        if (rows.length === 0) {
            throw new Error('Notification not found');
        }
        return rows[0];  // Devuelve la notificación actualizada
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw new Error('Error marking notification as read');
    }
};

// Función para obtener las notificaciones no leídas de un usuario
export const getUnreadNotifications = async (userId) => {
    try {
        const query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 AND status = 'unread'
      ORDER BY created_at DESC;
    `;
        const { rows } = await pool.query(query, [userId]);
        return rows;
    } catch (error) {
        console.error('Error fetching unread notifications:', error);
        throw new Error('Error fetching unread notifications');
    }
};
