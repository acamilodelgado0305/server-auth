import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";

export const authenticateToken = (req, res, next) => {
    // Obtener el token de la cabecera 'Authorization'
    const token = req.header('Authorization')?.split(' ')[1];

    // Si no hay token, responder con 401 (Unauthorized)
    if (!token) return res.sendStatus(401);

    // Verificar el token
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Si el token no es válido, responder con 403 (Forbidden)

        req.user = user;
        next();
    });
};
