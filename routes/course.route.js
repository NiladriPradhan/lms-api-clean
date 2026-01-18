import express from "express";
import {
  createCourse,
  editCourse,
  getAllCourse,
  getCourseById,
  getPublishedCourse,
  searchCourse,
} from "../controllers/course.controller.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import upload from "../utils/multer.js";
import {
  createLecture,
  editLecture,
  getCourseLecture,
  getLectureById,
  removeLecture,
  togglePublishCourse,
} from "../controllers/lecture.controller.js";

const router = express.Router();

router.route("/create").post(isAuthenticated, createCourse);
router.route("/courses").get(isAuthenticated, getAllCourse);
router.route("/search").get(isAuthenticated, searchCourse);
router.route("/published-courses").get(getPublishedCourse);
router
  .route("/:courseId")
  .put(isAuthenticated, upload.single("courseThumbnail"), editCourse);
router.route("/:courseId").get(isAuthenticated, getCourseById);

router.route("/:courseId/lecture").post(isAuthenticated, createLecture);
router.route("/:courseId/lecture").get(isAuthenticated, getCourseLecture);
router.route("/:courseId/lecture/:lectureId").put(isAuthenticated, editLecture);
router.route("/lecture/:lectureId").delete(isAuthenticated, removeLecture);
router.route("/lecture/:lectureId").get(isAuthenticated, getLectureById);

router.route("/:courseId").patch(isAuthenticated, togglePublishCourse);

export default router;
