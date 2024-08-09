import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  loginUser,
  updateUser,
  deleteUser,
} from "../controllers/index.controller.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = Router();

// Rutas públicas
router.get("/users", authenticateToken, getUsers);
router.get("/users/:id", authenticateToken, getUserById);
router.post("/register", createUser);
router.post("/login", loginUser);

// Rutas protegidas por el middleware de autenticación
router.put("/users/:id", authenticateToken, updateUser);
router.delete("/users/:id", authenticateToken, deleteUser);

export default router;
