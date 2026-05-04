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
  AddToWishlist,
  ProductReview
} from "../controllers/ProductController.js";

import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";
import User from "../models/userModel.js";


const UserRouter = express.Router();
 

// user account related routes
UserRouter.post("/register", createUser);  
UserRouter.post("/login", loginUser);
UserRouter.post("/logout", authenticate, logoutUser);
UserRouter.get("/profile", authenticate, getprofile);
UserRouter.put("/profile", authenticate, updateProfile);


// user action related to products
UserRouter.get("/products",authenticate, getProducts);
UserRouter.get("/products/:id", authenticate, getProductById);
UserRouter.post("/products/:id/wishlist", authenticate, AddToWishlist); 
UserRouter.post("/products/:id/reviews", authenticate, ProductReview); 


  
export default UserRouter; 
