import asyncHandler from "express-async-handler";
import {Admin} from '../models/AdminModel.js'
import User from "../models/userModel.js";
import Product from "../models/ProductModel.js";
import { createToken } from "../middlewares/JWT.js";
import bcrypt from "bcryptjs/dist/bcrypt.js";
import ExtractProductDetailsFromRequest from "../HealpingMaterials/AdminHelper.js";



// admain Account

export const createAdminAccount = asyncHandler(async (req, res) => {
  const { username, email, password , role} = req.body;


  const ExistingAdmin = await Admin.findOne({ email });
  if (ExistingAdmin) {
    res.status(400);
    throw new Error("Admin account already exists");
  }

  switch (role) {
    case "product-editor":
      role = {
        name: "product-editor",
        permissions: ["manage-products"],
      };
      break;
    case "user-manager":
      role = {
        name: "user-manager",
        permissions: ["manage-users"],
      };
      break;
    case "delivery-manager":
      role = {
        name: "delivery-manager",
        permissions: ["manage-delivery"],
      };
      break;
    case "super-admin":
      role = {
        name: "super-admin",
        permissions: ["*"],
      };
      break;
    default:
      res.status(400);
      throw new Error("Invalid role specified");
  }

  const adminUser = new Admin({
    username,
    email,
    password,
    role,
    isAdmin: true,
  });

}
);

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });
  

  if (admin && (await bcrypt.compare(password, admin.password))) {
  const token = createToken(res, admin._id); 

  res.json({
    _id: admin._id,
    username: admin.username,
    email: admin.email,
    isAdmin: admin.isAdmin,
    token,
  });
} else {
  res.status(401);
  throw new Error("Invalid email or password");
}
});


export const logout = asyncHandler(async (req, res) => {
  res.json({ message: "Logged out successfully" });
});

  





//user account related admin actions


export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password");
  res.status(200).json(users);
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
     const theRequiredUser =  await User.findOne({ _id: user._id });

   theRequiredUser.accountSatus = false;

   await theRequiredUser.save();
    res.json({ message: "User deactiviated successfully" });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

export const activateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
     const theRequiredUser =  await User.findOne({ _id: user._id });

   theRequiredUser.accountSatus = true;

   await theRequiredUser.save();
    res.json({ message: "User activiated successfully" });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});








 







