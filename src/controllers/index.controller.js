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
      "SELECT * FROM users WHERE username ILIKE $1 ORDER BY id ASC LIMIT $2 OFFSET $3",
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
    const response = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    res.json(response.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    console.log("Request body:", req.body);

    const { username, email, password, role } = req.body;

    // Verificar si los campos requeridos están presentes
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el nuevo usuario con el campo role
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

    // Cargar la plantilla HTML para el usuario
    const emailTemplatePath = path.join(__dirname, '../templates/welcomeEmailTemplate.html');
    const emailHtml = renderTemplate(emailTemplatePath, { username, email });

    // Opciones de correo para el usuario
    const mailOptionsUser = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Registro Exitoso',
      html: emailHtml,
    };

    // Cargar la plantilla HTML para el administrador
    const adminEmailTemplatePath = path.join(__dirname, '../templates/adminNotificationTemplate.html');
    const adminEmailHtml = renderTemplate(adminEmailTemplatePath, { username, email });

    // Opciones de correo para el administrador
    const mailOptionsAdmin = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL, // Correo del administrador
      subject: 'Nuevo Usuario Registrado',
      html: adminEmailHtml,
    };

    // Enviar correo al usuario
    transporter.sendMail(mailOptionsUser, (error, info) => {
      if (error) {
        return console.error('Error al enviar el correo al usuario:', error);
      }
      console.log('Correo enviado al usuario: ' + info.response);
    });

    // Enviar correo al administrador
    transporter.sendMail(mailOptionsAdmin, (error, info) => {
      if (error) {
        return console.error('Error al enviar el correo al administrador:', error);
      }
      console.log('Correo enviado al administrador: ' + info.response);
    });

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: error.message });
  }
};


export const updateUserInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, address, profilepictureurl } = req.body;

    // Verificar si al menos uno de los campos está presente
    if (!phone && !address && !profilepictureurl) {
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
    if (profilepictureurl) updates.push(`profilepictureurl = '${profilepictureurl}'`);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $1 RETURNING id, email, phone, address, profilepictureurl`;
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
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { username, email, role } = req.body;

    // Verificar si el role está presente y válido (opcional)
    const validRoles = ["superadmin", "admin", "user"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role provided" });
    }

    // Actualizar los campos proporcionados
    const { rows } = await pool.query(
      "UPDATE users SET username = $1, email = $2, role = $3 WHERE id = $4 RETURNING *",
      [username, email, role, id]
    );

    res.json(rows[0]);
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
