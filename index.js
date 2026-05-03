import "dotenv/config";

//packages
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

//utiles
import connectDB from "./config/db.js";
import AdminRouter from "./routes/AdminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
// import categoryRoutes from "./routes/categoryRoutes.js";

const port = process.env.PORT || 5000;

connectDB();

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middlewares
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use("/api/admin", AdminRouter);
app.use("/api/users", userRoutes);
// app.use("/api/category", categoryRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
