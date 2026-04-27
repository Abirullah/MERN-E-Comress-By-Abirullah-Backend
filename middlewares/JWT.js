import jwt from "jsonwebtoken";
import asyncHandler from "./asyncHandler.js";
import { JWT_LIFETIME } from "../Constant.js";

export const createToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("Token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: JWT_LIFETIME ? parseInt(JWT_LIFETIME) * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
  });
};

export const verifyToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies.Token;

  if (!token) {
    res.status(401);
    throw new Error("Unauthorized: No token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decoded.userId };
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Unauthorized: Invalid token");
  }
});