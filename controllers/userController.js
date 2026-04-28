import User from "../models/userModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import bcrypt from "bcryptjs";
import createToken from "../utils/createToken.js";
import { authCookieOptions } from "../utils/cookieOptions.js";
import {
  buildPublicUserResponse,
  createUserApiError,
  handleUserApiError,
  normalizeLoginPayload,
  normalizeProfileUpdatePayload,
  normalizeRegisterPayload,
} from "../HealpingMaterials/UserAPIsHerper.js";

const createUser = asyncHandler(async (req, res) => {
  try {
    const { username, email, password, Profile } = normalizeRegisterPayload(
      req.body
    );
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      ...(Profile ? { Profile } : {}),
    });

    const createdUser = await newUser.save();
    createToken(res, createdUser._id);

    return res.status(201).json({
      ...buildPublicUserResponse(createdUser),
    });
  } catch (error) {
    handleUserApiError(res, error);
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = normalizeLoginPayload(req.body);
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      throw createUserApiError("Invalid email or password", 401);
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);

    if (isPasswordValid) {
      createToken(res, existingUser._id);

      res.status(200).json(buildPublicUserResponse(existingUser));
      return;
    }
  } catch (error) {
    handleUserApiError(res, error);
    return;
  }

  res.status(401).json({ message: "Invalid email or password" });
});

const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    ...authCookieOptions,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
});

const getprofile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json(buildPublicUserResponse(user));
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const updateProfile = asyncHandler(async (req, res) => {
  try {
    const updates = normalizeProfileUpdatePayload(req.body);
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (updates.email && updates.email !== user.email) {
      const existingUser = await User.findOne({
        email: updates.email,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        throw createUserApiError("Email is already in use");
      }
    }

    if (updates.username !== undefined) {
      user.username = updates.username;
    }

    if (updates.email !== undefined) {
      user.email = updates.email;
    }

    if (updates.Profile) {
      user.Profile = {
        ...(user.Profile?.toObject?.() || user.Profile || {}),
        ...updates.Profile,
      };
    }

    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(updates.password, salt);
    }

    const updatedUser = await user.save();

    res.json(buildPublicUserResponse(updatedUser));
  } catch (error) {
    handleUserApiError(res, error);
  }
});

export {
  createUser,
  loginUser,
  logoutUser,
  getprofile,
  updateProfile,
};
