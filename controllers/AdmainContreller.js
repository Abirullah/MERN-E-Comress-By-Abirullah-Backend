import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";

import { Admin } from "../models/AdminModel.js";
import User from "../models/userModel.js";
import createToken from "../utils/createToken.js";
import { authCookieOptions } from "../utils/cookieOptions.js";

const buildRole = (role) => {
  if (typeof role === "object" && role !== null) {
    const permissions = Array.isArray(role.permissions) && role.permissions.length > 0
      ? role.permissions.map((permission) => (permission === "*" ? "All" : permission))
      : ["All"];

    return {
      name: role.name || "super-admin",
      permissions,
    };
  }

  switch (role) {
    case "product-editor":
      return { name: "product-editor", permissions: ["manage-products"] };
    case "user-manager":
      return { name: "user-manager", permissions: ["manage-users"] };
    case "delivery-manager":
      return { name: "delivery-manager", permissions: ["manage-delivery"] };
    case "super-admin":
    default:
      return { name: "super-admin", permissions: ["All"] };
  }
};

const buildAdminResponse = (admin, token) => ({
  _id: admin._id,
  name: admin.name,
  username: admin.name,
  email: admin.email,
  isAdmin: true,
  isActive: admin.isActive,
  role: admin.role,
  token,
});

export const createAdminAccount = asyncHandler(async (req, res) => {
  const { name, username, email, password, role } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const existingAdmin = await Admin.findOne({ email });

  if (existingAdmin) {
    res.status(400);
    throw new Error("Admin account already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await Admin.create({
    name: name || username,
    email,
    password: hashedPassword,
    role: buildRole(role),
    isAdmin: true,
  });

  const token = createToken(res, admin._id);

  res.status(201).json(buildAdminResponse(admin, token));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const admin = await Admin.findOne({ email });

  if (!admin) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, admin.password);

  if (!passwordMatches) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const token = createToken(res, admin._id);

  res.status(200).json(buildAdminResponse(admin, token));
});

export const logout = asyncHandler(async (req, res) => {
  res.cookie("Token", "", {
    ...authCookieOptions,
    expires: new Date(0),
  });
  res.cookie("jwt", "", {
    ...authCookieOptions,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password");
  res.status(200).json(users);
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json(user);
});

export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.accountStatus = false;
  await user.save();

  res.json({ message: "User deactivated successfully", user });
});

export const activateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.accountStatus = true;
  await user.save();

  res.json({ message: "User activated successfully", user });
});
