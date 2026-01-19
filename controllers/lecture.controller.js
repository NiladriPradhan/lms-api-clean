import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import Lecture from "../models/lecture.model.js";
import { deleteVideoFromCloudinary } from "../utils/cloudinary.js";

// export const createLecture = async (req, res) => {
//   try {
//     const { lectureTitle } = req.body;
//     const { courseId } = req.params;
//     if (!lectureTitle || !courseId) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required to create lecture",
//       });
//     }
//     const newLecture = await Lecture.create({
//       lectureTitle,
//     });
//     const course = await Course.findById(courseId);
//     if (course) {
//       course.lectures.push(newLecture._id);
//       await course.save();
//     }
//     return res.status(201).json({
//       newLecture,
//       success: true,
//       message: "Lecture created successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// export const createLecture = async (req, res) => {
//   try {
//     const { lectureTitle, videoInfo } = req.body;
//     const { courseId } = req.params;

//     if (!lectureTitle || !courseId || !videoInfo?.videoUrl) {
//       return res.status(400).json({
//         success: false,
//         message: "Lecture title and video are required",
//       });
//     }

//     const newLecture = await Lecture.create({
//       lectureTitle,
//       videoUrl: videoInfo.videoUrl,
//       publicId: videoInfo.publicId,
//     });

//     await Course.findByIdAndUpdate(courseId, {
//       $push: { lectures: newLecture._id },
//     });

//     return res.status(201).json({
//       success: true,
//       newLecture,
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false });
//   }
// };

export const createLecture = async (req, res) => {
  try {
    const { lectureTitle } = req.body;
    const { courseId } = req.params;

    if (!lectureTitle || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Lecture title is required",
      });
    }

    const newLecture = await Lecture.create({
      lectureTitle,
      videoUrl: "",
      publicId: "",
    });

    await Course.findByIdAndUpdate(courseId, {
      $push: { lectures: newLecture._id },
    });

    return res.status(201).json({
      success: true,
      message: "Lecture created successfully",
      lecture: newLecture,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

export const getCourseLecture = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }
    const course = await Course.findById(courseId).populate("lectures");
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      lectures: course.lectures,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const editLecture = async (req, res) => {
  try {
    const { lectureTitle, videoInfo, isPreviewFree } = req.body;
    const { courseId, lectureId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lecture ID",
      });
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found",
      });
    }

    if (lectureTitle) lecture.lectureTitle = lectureTitle;
    if (videoInfo?.videoUrl) lecture.videoUrl = videoInfo.videoUrl;
    if (videoInfo?.publicId) lecture.publicId = videoInfo.publicId;
    if (typeof isPreviewFree === "boolean") {
      lecture.isPreviewFree = isPreviewFree;
    }

    await lecture.save();

    const course = await Course.findById(courseId);
    if (course && !course.lectures.includes(lecture._id)) {
      course.lectures.push(lecture._id);
      await course.save();
    }

    return res.status(200).json({
      success: true,
      message: "Lecture updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const removeLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;

    // 1️⃣ Delete lecture
    const lecture = await Lecture.findByIdAndDelete(lectureId);
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found",
      });
    }

    // 2️⃣ Delete video from Cloudinary
    if (lecture.publicId) {
      await deleteVideoFromCloudinary(lecture.publicId);
    }

    // 3️⃣ REMOVE lecture reference from course (🔥 FIX)
    await Course.updateOne(
      { lectures: lectureId }, // filter
      { $pull: { lectures: lectureId } }, // update
    );

    return res.status(200).json({
      success: true,
      message: "Lecture removed successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete lecture",
    });
  }
};

export const getLectureById = async (req, res) => {
  try {
    const { lectureId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lecture ID",
      });
    }
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found",
      });
    }
    return res.status(200).json({
      success: true,
      lecture,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to get lecture by id",
    });
  }
};

export const togglePublishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { publish } = req.query;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }
    course.isPublished = publish === "true";
    await course.save();
    const statusMesage = course.isPublished ? "Published" : "Unpublished";
    return res.status(200).json({
      message: `Course is ${statusMesage}`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};
