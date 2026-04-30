import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import asyncHandler from "./asyncHandler.js";

const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  token = req.cookies.jwt;

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

const authorizeAdmin = (RequiredRole , req, res, next) => {

  let token = req.cookies.jwt;

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

   if (!decoded) {
    res.status(401);
    throw new Error("Unauthorized, token failed");
  } 

  if (decoded.role !== "super-admin") {
    res.status(403);
    throw new Error("Forbidden: You don't have permission to access this resource");
  }

    next();
  
};

export { authenticate, authorizeAdmin }; 