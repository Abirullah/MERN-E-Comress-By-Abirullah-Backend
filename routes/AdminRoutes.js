import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
} from "../controllers/userController.js";

import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

//admin account routes
router.post("/create-admin",  createAdminAccount);




// Admin action routes
router.route("/all").get(authenticate, authorizeAdmin, getAllUsers);
router.get("/:id", authenticate, authorizeAdmin, getUserById);
router.put("/:id", authenticate, authorizeAdmin, updateUserById);
router.delete("/:id", authenticate, authorizeAdmin, deleteUserById);