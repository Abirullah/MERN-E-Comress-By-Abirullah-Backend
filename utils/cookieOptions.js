const isProduction = process.env.NODE_ENV === "production";
const sameSite = process.env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax");
const secure =
  process.env.COOKIE_SECURE === "true" || sameSite === "none" || isProduction;

export const authCookieOptions = {
  httpOnly: true,
  sameSite,
  secure,
};
