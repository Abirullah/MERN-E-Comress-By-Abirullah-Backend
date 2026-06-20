import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import asyncHandler from "./asyncHandler.js";
import { Admin } from "../models/AdminModel.js";

const getBearerToken = (req) => {
  const header = req.headers.authorization || req.headers.Authorization;

  if (!header || typeof header !== "string") {
    return null;
  }

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
};

const getCookieToken = (req) => req.cookies?.Token || req.cookies?.jwt || null;

const authenticate = asyncHandler(async (req, res, next) => {
  const token = getCookieToken(req) || getBearerToken(req);

  if (!token) {
    res.status(401);
    throw new Error("Unauthorized, no token");
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.status(401);
    throw new Error("Unauthorized, token failed");
  }

  const user = await User.findById(decoded.userId).select("-password");

  if (!user) {
    res.status(401);
    throw new Error("Unauthorized, user not found");
  }

  if (user.accountStatus === false) {
    res.status(403);
    throw new Error("Your account has been deactivated");
  }

  req.user = user;
  next();
});

const authenticateAdmin = asyncHandler(async (req, res, next) => {
  const token = getCookieToken(req) || getBearerToken(req);

  if (!token) {
    res.status(401);
    throw new Error("Unauthorized, no admin token");
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.status(401);
    throw new Error("Unauthorized, token failed");
  }

  const admin = await Admin.findById(decoded.userId);

  if (!admin) {
    res.status(401);
    throw new Error("Unauthorized, admin not found");
  }

  req.admin = admin;
  req.user = admin;
  next();
});

const authorizeAdmin = (requiredRole) => {
  return asyncHandler(async (req, res, next) => {
    const admin = req.admin || req.user;
    let permissions = admin?.role?.permissions || [];

    if (!Array.isArray(permissions)) {
      permissions = [];
    }

    if (!admin) {
      res.status(403);
      throw new Error("Forbidden: admin credentials required");
    }

    if (!permissions.includes("All") && !permissions.includes(requiredRole)) {
      res.status(403);
      throw new Error("Forbidden: You don't have permission to access this resource");
    }

    next();
  });
};

export { authenticate, authenticateAdmin, authorizeAdmin };
