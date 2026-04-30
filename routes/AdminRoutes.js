import express from "express";
import { createAdminAccount, login , logout } from "../controllers/AdmainContreller.js";
import { getAllUsers } from "../controllers/AdmainContreller.js";


import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";
import { IsThereAnyAdmin } from "../middlewares/AdminPermission.js";

const AdminRouter = express.Router();

//admin account routes
AdminRouter.post("/create-admin", IsThereAnyAdmin, authenticate ,authorizeAdmin("super-admin"),  createAdminAccount);
AdminRouter.post('/login', login);
AdminRouter.post('/logout', authenticate, logout);



// Admin action routes

AdminRouter.get("/users" , authenticate, authorizeAdmin , getAllUsers);


export default AdminRouter;