import express from "express";
import { createAdminAccount, login , logout } from "../controllers/AdmainContreller.js";
import { getAllUsers , deactivateUser , activateUser , getUserById , createProduct } from "../controllers/AdmainContreller.js";


import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";
import { IsThereAnyAdmin } from "../middlewares/AdminPermission.js";

const AdminRouter = express.Router();

//admin account routes
AdminRouter.post("/create-admin", IsThereAnyAdmin, authenticate ,authorizeAdmin,  createAdminAccount);
AdminRouter.post('/login', login);
AdminRouter.post('/logout', authenticate, logout);



// user Account related Admin action routes

AdminRouter.get("/users" , authenticate, authorizeAdmin("manage-users") , getAllUsers);
AdminRouter.get("/users/:id" , authenticate, authorizeAdmin("manage-users") , getUserById);
AdminRouter.put("/users/:id/activate" , authenticate, authorizeAdmin("manage-users") , activateUser);
AdminRouter.put("/users/:id/deactivate" , authenticate, authorizeAdmin("manage-users") , deactivateUser);


// product related Admin action routes

AdminRouter.post("/products" , authenticate, authorizeAdmin("manage-products") , createProduct);

export default AdminRouter;



