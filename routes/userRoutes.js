import express from "express";
import {
  createUser,
  loginUser,
  logoutUser,
  getprofile,
  updateProfile,
} from "../controllers/userController.js";

import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";


const UserRouter = express.Router();
 
UserRouter.post("/register", createUser);  
UserRouter.post("/login", loginUser);
UserRouter.post("/logout", authenticate, logoutUser);
UserRouter.get("/profile", authenticate, getprofile);
UserRouter.put("/profile", authenticate, updateProfile);


  
export default UserRouter; 
