import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';
import { pool } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { io } from '../index.js';

dotenv.config();

// Obtener el directorio actual del archivo
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Función para cargar y reemplazar variables en la plantilla
const renderTemplate = (templatePath, variables) => {
  let template = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    template = template.replace(regex, value);
  }
  return template;
};



export const getUsers = async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const offset = (page - 1) * limit;

  try {
    const response = await pool.query(
      "SELECT id, username, email, address, phone, role, profilepictureurl FROM users WHERE username ILIKE $1 ORDER BY id ASC LIMIT $2 OFFSET $3",
      [`%${search}%`, parseInt(limit), parseInt(offset)]
    );

    res.status(200).json(response.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const response = await pool.query(
      "SELECT id, username, email, address, phone, profilepictureurl FROM users WHERE id = $1",
      [id]
    );
    if (response.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(response.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    console.log("Request body:", req.body);

    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [username, email, hashedPassword, role]
    );

    // Configurar transporte de correo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailTemplatePath = path.join(__dirname, '../templates/welcomeEmailTemplate.html');
    const emailHtml = renderTemplate(emailTemplatePath, { username, email });

    const mailOptionsUser = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Registro Exitoso',
      html: emailHtml,
    };

    const adminEmailTemplatePath = path.join(__dirname, '../templates/adminNotificationTemplate.html');
    const adminEmailHtml = renderTemplate(adminEmailTemplatePath, { username, email });

    const mailOptionsAdmin = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'Nuevo Usuario Registrado',
      html: adminEmailHtml,
    };

    // Enviar correos
    await transporter.sendMail(mailOptionsUser);
    await transporter.sendMail(mailOptionsAdmin);

    // Emitir un evento a través de Socket.io para notificar al frontend
    io.emit('userRegistered', { message: `Nuevo usuario registrado: ${username}`, email });

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: error.message });
  }
};


export const updateUserInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, address, username } = req.body;

    // Verificar si al menos uno de los campos está presente
    if (!phone && !address && !username) {
      return res.status(400).json({ message: "At least one field is required" });
    }

    // Verificar si el usuario existe
    const userExists = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Crear consulta dinámica para actualizar solo los campos proporcionados
    const updates = [];
    if (phone) updates.push(`phone = '${phone}'`);
    if (address) updates.push(`address = '${address}'`);
    if (username) updates.push(`username = '${username}'`);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $1 RETURNING id, username, email, phone, address`;
    const { rows } = await pool.query(query, [id]);

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error updating user info:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "48h" }  // Token expira después de 48 horas
    );

    // Guardar el token en la base de datos
    await pool.query(
      "UPDATE users SET token = $1 WHERE id = $2",
      [token, user.id]
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getToken = async (req, res) => {
  try {
    const { id } = req.params;  // Cambiar userId por id

    // Buscar el token en la base de datos
    const { rows } = await pool.query("SELECT token FROM users WHERE id = $1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Token not found" });
    }

    res.json({ token: rows[0].token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { username, email, role, password } = req.body;

    // Verificar si el role está presente y es válido (opcional)
    const validRoles = ["superadmin", "cajero", "usuario", "tecnico"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role provided" });
    }

    // Verificar si el usuario existe
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Crear una lista de actualizaciones dinámicas
    const updates = [];
    const values = [];

    if (username) {
      updates.push(`username = $${updates.length + 1}`);
      values.push(username);
    }

    if (email) {
      updates.push(`email = $${updates.length + 1}`);
      values.push(email);
    }

    if (role) {
      updates.push(`role = $${updates.length + 1}`);
      values.push(role);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${updates.length + 1}`);
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields provided for update" });
    }

    values.push(id);

    // Ejecutar la consulta de actualización solo con los campos enviados
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${updates.length + 1} RETURNING id, username, email, role, phone, address, profilepictureurl`;
    const { rows } = await pool.query(query, values);

    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const deleteUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [id]);

    if (rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfilePicture = async (req, res) => {
  try {
    const { id } = req.params;
    const { profilepictureurl } = req.body;

    if (!profilepictureurl) {
      return res.status(400).json({ message: "No se proporcionó la URL de la imagen" });
    }

    const query = "UPDATE users SET profilepictureurl = $1 WHERE id = $2 RETURNING id, profilepictureurl";
    const { rows } = await pool.query(query, [profilepictureurl, id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error al actualizar la imagen del usuario:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { id } = req.params; // ID del usuario
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new passwords are required" });
    }

    // Verificar si el usuario existe
    const { rows } = await pool.query("SELECT password FROM users WHERE id = $1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    // Comparar la contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña en la base de datos
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, id]);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const { rows } = await pool.query("SELECT id, email, username FROM users WHERE email = $1", [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });

    // Guardar token temporalmente en la base de datos
    await pool.query("UPDATE users SET reset_token = $1 WHERE id = $2", [token, user.id]);

    // Enviar correo de recuperación
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `https://ispsuite.app.la-net.co/reset-password?token=${token}`;
    const emailTemplatePath = path.join(__dirname, "../templates/resetPasswordEmailTemplate.html");
    const emailHtml = renderTemplate(emailTemplatePath, { username: user.username, resetLink });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Recovery",
      html: emailHtml,
    });

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = decoded;

    // Verificar si el token coincide en la base de datos
    const { rows } = await pool.query("SELECT reset_token FROM users WHERE id = $1", [id]);
    if (rows.length === 0 || rows[0].reset_token !== token) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña y limpiar el token
    await pool.query("UPDATE users SET password = $1, reset_token = NULL WHERE id = $2", [hashedPassword, id]);

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
