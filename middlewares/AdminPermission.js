import {Admin} from '../models/AdminModel.js'
import bcrypt from 'bcryptjs/dist/bcrypt.js';


const checkPermission = (permission) => {
  return (req, res, next) => {
    const admin = req.admin;

    if (!admin || !admin.role) {
      return res.status(403).json({ message: "Access denied" });
    }

    const permissions = admin.role.permissions;

    const allowed =
      permissions.includes(permission) || permissions.includes("*") || permissions.includes("All");

    if (!allowed) {
      return res.status(403).json({ message: "Not allowed" });
    }

    next();
  };
};

const IsThereAnyAdmin = async (req, res, next) => {
  const existingAdmin = await Admin.findOne();
  if (!existingAdmin) {
    const { name, username, email, password, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const normalizedRole =
      typeof role === "string"
        ? {
            name: role,
            permissions:
              role === "product-editor"
                ? ["manage-products"]
                : role === "user-manager"
                ? ["manage-users"]
                : role === "delivery-manager"
                ? ["manage-delivery"]
                : ["All"],
          }
        : role || {
            name: "super-admin",
            permissions: ["All"],
          };

    await Admin.create({
      name: name || username,
      email: email,
      password: hashedPassword,
      role: normalizedRole,
      isAdmin: true,
    });

    res.status(201).json({ message: "Admin account created successfully" });
    return;
  }
  next();
};

export { checkPermission, IsThereAnyAdmin };
