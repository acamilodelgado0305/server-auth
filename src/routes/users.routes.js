import { Router } from "express";
import multer from 'multer';
import {
  getUsers,
  getUserById,
  createUser,
  loginUser,
  updateUser,
  deleteUser,
  updateUserInfo,
  getToken,
  updateProfilePicture,
  changePassword,
  forgotPassword,
  resetPassword

} from "../controllers/index.controller.js";
//import { uploadImageToCloudinary } from "../controllers/image.controller.js";
import { uploadFileToServer, uploadFile } from "../controllers/image.controller.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = Router();

const upload = multer({ dest: 'uploads/' });

// Rutas públicas
router.get("/users", authenticateToken, getUsers);
router.get("/users/:id", authenticateToken, getUserById);
router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/users/:id/token", getToken);
//router.post('/upload-image', upload.single('image'), uploadImageToCloudinary);
router.post(
  '/upload-file',
  //requireAuth,     
  uploadFileToServer,
  uploadFile
);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.put("/users/:id", authenticateToken, updateUser);
router.put('/update-info/:id', authenticateToken, updateUserInfo);
router.delete("/users/:id", authenticateToken, deleteUser);
router.put('/:id/profile-picture', updateProfilePicture);
router.put('/users/:id/change-password', authenticateToken, changePassword);
export default router;
