import express from "express";
import {
  createUser,
  loginUser,
  logoutCurrentUser,
  getUserProfile,
  updateUserProfile,
} from "../controllers/userController.js";

import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";


const router = express.Router();

router.post("/register", createUser);  
router.post("/login", loginUser);
router.post("/logout", logoutCurrentUser);
router.get("/profile", authenticate, getUserProfile);
router.put("/profile", authenticate, updateUserProfile);

 
export default router; 
