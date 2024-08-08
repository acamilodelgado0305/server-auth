import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  loginUser,
  updateUser,
  deleteUser,
} from "../controllers/index.controller.js";

const router = Router();

router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.post("/register", createUser);
router.post("/login", loginUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

export default router;
