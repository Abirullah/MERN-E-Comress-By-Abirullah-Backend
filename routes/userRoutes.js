import express from "express";
import {
  createUser,
  loginUser,
  logoutUser,
  getprofile,
  updateProfile
} from "../controllers/userController.js";

import { 
  getProducts ,
  getProductById,
  ToggleToWishlist,
  ProductReview,
  getwishlist,
  PlaceOrder
} from "../controllers/ProductController.js";

import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";
import User from "../models/userModel.js";
import CheackOut from "../controllers/CheckOutController.js";


const UserRouter = express.Router();
 

// user account related routes
UserRouter.post("/register", createUser);  
UserRouter.post("/login", loginUser);
UserRouter.post("/logout", authenticate, logoutUser);
UserRouter.get("/profile", authenticate, getprofile);
UserRouter.put("/profile", authenticate, updateProfile);


// user action related to products
UserRouter.get("/products", getProducts);
UserRouter.get("/products/:id", getProductById);
UserRouter.post("/products/:id/wishlist", authenticate, ToggleToWishlist); 
UserRouter.post("/products/:id/reviews", authenticate, ProductReview); 
UserRouter.get("/:id/wishlist" , authenticate , getwishlist);
UserRouter.post("/products/:id/order", authenticate, CreateCheckOut, PlaceOrder);




  
export default UserRouter; 
