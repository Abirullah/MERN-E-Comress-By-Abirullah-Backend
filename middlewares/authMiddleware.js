import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import asyncHandler from "./asyncHandler.js";
import { Admin } from "../models/AdminModel.js";

const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  token = req.cookies.Token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select("-password");
      next();
    } catch (error) {
      res.status(401);
      throw new Error("Unauthorized, token failed"); 
    }
  } else {
    res.status(401);
    throw new Error("Unauthorized, no token");
  }
});

const authorizeAdmin =  (RequiredRole) => {

  return  async (req, res, next) => {


  let token = req.cookies.Token;

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

   if (!decoded) {
    res.status(403).json({ error: "Unauthorized, token failed .." });
  } 

 

  const AdminData = await Admin.findById(decoded.userId);

  const AdminRole = AdminData.role.permissions[0]


   if (!AdminRole) { 
    res.status(403).json({ error: "Forbidden: You don't have permission to access this resource" });
  } 


 
  if (AdminRole !== "All" && AdminRole !== RequiredRole) {
    res.status(403).json({ error: "Forbidden: You don't have permission to access this resource..." });
  }
 
    next();
  
};
};

export { authenticate, authorizeAdmin }; 