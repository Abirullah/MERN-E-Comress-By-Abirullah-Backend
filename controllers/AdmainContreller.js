import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { createToken } from "../middlewares/JWT.js";



// admain Account

export const createAdminAccount = asyncHandler(async (req, res) => {
  const { username, email, password , role} = req.body;

  const IsThereAnAdmin = await User.findOne({ isAdmin: true });


   if (!IsThereAnAdmin) {
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: username,
      email: email,
      password: hashedPassword,
      role: role || "super-admin",
    });

    console.log("First admin created");
  }
}
);

  





// admin actions


const createAdminAccount = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;


  const existingAdmin = await User.findOne({ isAdmin: true });
  if (existingAdmin) {
    res.status(400);
    throw new Error("Admin account already exists");
  }

  const adminUser = new User({
    username,
    email,
    password,
    isAdmin: true,
  });

  const createdAdmin = await adminUser.save();

  res.status(201).json({
    _id: createdAdmin._id,
    username: createdAdmin.username,
    email: createdAdmin.email,
    isAdmin: createdAdmin.isAdmin,
    token: createToken(createdAdmin._id),
  });
});









const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password");
  res.json(users);
});

const deleteUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    if (user.isAdmin) {
      res.status(400);
      throw new Error("Cannot delete admin user");
    }

    await user.deleteOne({ _id: user._id });
    res.json({ message: "User deleted successfully" });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const updateUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.isAdmin = Boolean(req.body.isAdmin);

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});