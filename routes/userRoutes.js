import express from "express";
import {
  createUser,
  loginUser,
  logoutUser,
  getprofile,
  updateProfile,
} from "../controllers/userController.js";

import {
  getProducts ,
  getProductById,
  ToggleToWishlist,
  ProductReview,
  getwishlist,
  UserOrders,
  getOrderById,
  OrderRecieved
} from "../controllers/ProductController.js";
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/NotificationController.js";

import { authenticate } from "../middlewares/authMiddleware.js";
import { CreateCheckOut } from "../controllers/CheackOutController.js";


const UserRouter = express.Router();
 

// user account related routes
UserRouter.post("/register", createUser);  
UserRouter.post("/login", loginUser);
UserRouter.post("/logout", authenticate, logoutUser);
UserRouter.get("/profile", authenticate, getprofile);
UserRouter.put("/profile", authenticate, updateProfile);
UserRouter.get("/notifications", authenticate, getMyNotifications);
UserRouter.patch("/notifications/read-all", authenticate, markAllNotificationsAsRead);
UserRouter.patch("/notifications/:id/read", authenticate, markNotificationAsRead);


// user action related to products
UserRouter.get("/products", getProducts);
UserRouter.get("/products/:id", getProductById);
UserRouter.post("/products/:id/wishlist", authenticate, ToggleToWishlist); 
UserRouter.post("/products/:id/reviews", authenticate, ProductReview); 
UserRouter.get("/:id/wishlist" , authenticate , getwishlist);
UserRouter.post("/products/:id/checkout", authenticate, CreateCheckOut);
UserRouter.get("/orders", authenticate, UserOrders);
UserRouter.get("/orders/:id", authenticate, getOrderById);
UserRouter.post("/orders/:id/received", authenticate , OrderRecieved);





  
export default UserRouter; 
