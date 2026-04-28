const checkPermission = (permission) => {
  return (req, res, next) => {
    const admin = req.admin;

    if (!admin || !admin.role) {
      return res.status(403).json({ message: "Access denied" });
    }

    const permissions = admin.role.permissions;

    const allowed =
      permissions.includes(permission) || permissions.includes("*");

    if (!allowed) {
      return res.status(403).json({ message: "Not allowed" });
    }

    next();
  };
};