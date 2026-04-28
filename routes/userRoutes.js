import express from "express";
import {
  createUser,
  loginUser,
  logoutUser,
  getprofile,
  updateProfile,
} from "../controllers/userController.js";

import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";


const router = express.Router();
 
router.post("/register", createUser);  
router.post("/login", loginUser);
router.post("/logout", authenticate, logoutUser);
router.get("/profile", authenticate, getprofile);
router.put("/profile", authenticate, updateProfile);


  
export default router; 
