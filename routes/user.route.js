import express from "express";
import {
  forgetPassword,
  getUserProfile,
  login,
  logout,
  register,
  updateProfile,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import upload from "../utils/multer.js";
import { loadUserProfile } from "../controllers/course.controller.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/profile").get(isAuthenticated, getUserProfile);
router.route("/my-course").get(isAuthenticated, loadUserProfile);

// router.route("/profile/update").put(isAuthenticated, updateProfile);
router.put(
  "/profile/update",
  isAuthenticated,
  upload.single("photo"),
  updateProfile,
);

router.route("/forgetPassword").post(forgetPassword);

export default router;
