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
      permissions.includes(permission) || permissions.includes("*");

    if (!allowed) {
      return res.status(403).json({ message: "Not allowed" });
    }

    next();
  };
};

const IsThereAnyAdmin = async (req, res, next) => {
  const existingAdmin = await Admin.findOne();
  if (!existingAdmin) {
    const { name, email, password , role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({
      name: name,
      email: email,
      password: hashedPassword,
      role: role || "super-admin",
    });

    res.status(201).json({ message: "Admin account created successfully" });

  }
  next();
};

export { checkPermission, IsThereAnyAdmin };
