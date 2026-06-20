import express from "express";
import { createAdminAccount, login , logout } from "../controllers/AdmainContreller.js";
import { 
    getAllUsers ,
    deactivateUser ,
    activateUser ,
    getUserById 
} from "../controllers/AdmainContreller.js";

import {
    createProduct,
    updateProduct,
    deleteProduct

} from "../controllers/ProductController.js"


import { authenticateAdmin, authorizeAdmin } from "../middlewares/authMiddleware.js";
import { IsThereAnyAdmin } from "../middlewares/AdminPermission.js";
import { uploadProductImages } from "../middlewares/CloudnaryMiddleWare.js";
import {
    getAdminDashboard,
    getAdminOrders,
    updateAdminOrder,
} from "../controllers/AdminOrderController.js";

const AdminRouter = express.Router();

//admin account routes
AdminRouter.post("/create-admin", IsThereAnyAdmin, authenticateAdmin, authorizeAdmin("All"),  createAdminAccount);
AdminRouter.post('/login', login);
AdminRouter.post('/logout', authenticateAdmin, logout);



// user Account related Admin action routes

AdminRouter.get("/dashboard" , authenticateAdmin, getAdminDashboard);
AdminRouter.get("/orders" , authenticateAdmin, authorizeAdmin("manage-delivery") , getAdminOrders);
AdminRouter.patch("/orders/:userId/:orderId" , authenticateAdmin, authorizeAdmin("manage-delivery") , updateAdminOrder);

AdminRouter.get("/users" , authenticateAdmin, authorizeAdmin("manage-users") , getAllUsers);
AdminRouter.get("/users/:id" , authenticateAdmin, authorizeAdmin("manage-users") , getUserById);
AdminRouter.put("/users/:id/activate" , authenticateAdmin, authorizeAdmin("manage-users") , activateUser);
AdminRouter.put("/users/:id/deactivate" , authenticateAdmin, authorizeAdmin("manage-users") , deactivateUser);


// product related Admin action routes

AdminRouter.post("/products" , authenticateAdmin, authorizeAdmin("manage-products") , uploadProductImages, createProduct);
AdminRouter.put("/products/:id" , authenticateAdmin, authorizeAdmin("manage-products") , uploadProductImages, updateProduct);
AdminRouter.delete("/products/:id" , authenticateAdmin, authorizeAdmin("manage-products") , deleteProduct);
export default AdminRouter;
