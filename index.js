import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./database/db.js";

import userRoute from "./routes/user.route.js";
import courseRoute from "./routes/course.route.js";
import mediaRoute from "./routes/media.route.js";
import purchaseRoute from "./routes/purchase.route.js";
import courseProgressRoute from "./routes/courseProgress.route.js";

dotenv.config();
const app = express();

/* ================= STRIPE WEBHOOK ONLY ================= */
app.post(
  "/api/v1/purchase/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    // forward to router manually
    next();
  },
);

/* ================= NORMAL MIDDLEWARE ================= */
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://lms-client-clean.vercel.app",
      "https://lms-frontend-v2-pink.vercel.app",
    ],
    credentials: true,
  }),
);

/* ================= ROUTES ================= */
app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "LMS backend api running successfully",
  });
});
app.use("/api/v1/purchase", purchaseRoute);
app.use("/api/v1/media", mediaRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/progress", courseProgressRoute);

app.get("/home", (req, res) => {
  res.status(200).json({
    success: true,
    message: "home page from server running 🟢",
  });
});

/* ================= SERVER ================= */
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server", err);
    process.exit(1);
  }
};

startServer();
