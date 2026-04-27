import jwt from "jsonwebtoken";
import { authCookieOptions } from "./cookieOptions.js";

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // Set JWT as an HTTP-Only Cookie
  res.cookie("jwt", token, {
    ...authCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
};

export default generateToken;
