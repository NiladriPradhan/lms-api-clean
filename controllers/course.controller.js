// export const createCourse = async (req, res) => {
//   try {
//     const {
//       courseTitle,
//       subTitle,
//       description,
//       category,
//       courseLevel,
//       coursePrice,
//       courseThumbnail,
//     } = req.body;
//     if (
//       !courseTitle ||
//       !subTitle ||
//       !description ||
//       !category ||
//       !courseLevel ||
//       !coursePrice ||
//       !courseThumbnail
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     } else {
//       const newCourse = await Course.create({
//         courseTitle,
//         subTitle,
//         description,
//         category,
//         courseLevel,
//         coursePrice,
//         courseThumbnail,
//         creator: req.id,
//       });
//       return res.status(201).json({
//         success: true,
//         newCourse,
//         message: "Course created successfully",
//       });
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };

import { Course } from "../models/course.model.js";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";

export const createCourse = async (req, res) => {
  try {
    const { courseTitle, category } = req.body;

    if (!courseTitle || !category) {
      return res.status(400).json({
        success: false,
        message: "Course title and category are required",
      });
    }

    const newCourse = await Course.create({
      courseTitle,
      category,
      creator: req.id,
    });

    return res.status(201).json({
      success: true,
      data: newCourse,
      message: "Course created successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllCourse = async (req, res) => {
  try {
    const userId = req.id;
    const courses = await Course.find({ creator: userId });
    if (!courses) {
      return res.status(404).json({
        success: false,
        message: "No course found",
      });
    }
    return res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const editCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const {
      courseTitle,
      subTitle,
      description,
      category,
      courseLevel,
      coursePrice,
    } = req.body;

    const thumbnail = req.file;

    let course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let courseThumbnail = course.courseThumbnail; // keep old by default

    // ✅ Upload new thumbnail only if user selected one
    if (thumbnail) {
      // delete old image if exists
      if (course.courseThumbnail) {
        const publicId = course.courseThumbnail.split("/").pop().split(".")[0];
        await deleteMediaFromCloudinary(publicId);
      }

      const uploaded = await uploadMedia(thumbnail.path);
      courseThumbnail = uploaded.secure_url;
    }

    const updatedData = {
      courseTitle,
      subTitle,
      description,
      category,
      courseLevel,
      coursePrice,
      courseThumbnail,
    };

    course = await Course.findByIdAndUpdate(courseId, updatedData, {
      new: true,
    });

    return res.status(200).json({
      success: true,
      course,
      message: "Course updated Successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({
        success: false,
        message: "Course not found",
      });
    }
    return res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to get course by id",
    });
  }
};

export const getPublishedCourse = async (req, res) => {
  try {
    const publishedCourses = await Course.find({ isPublished: true }).populate({
      path: "creator",
      select: "name photoUrl",
    });
    if (publishedCourses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No published courses found",
      });
    }

    return res.status(200).json({
      success: true,
      courses: publishedCourses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to get published course ",
    });
  }
};

//🔎 course searching

export const searchCourse = async (req, res) => {
  try {
    let { query = "", categories = "", sortByPrice = "" } = req.query;

    // convert categories to array
    const categoryArray =
      typeof categories === "string" && categories.length
        ? categories.split(",")
        : [];

    const searchCriteria = {
      isPublished: true,
      $or: [
        { courseTitle: { $regex: query, $options: "i" } },
        { subTitle: { $regex: query, $options: "i" } },
      ],
    };

    // ✅ category filter (CASE-INSENSITIVE)
    if (categoryArray.length > 0) {
      searchCriteria.category = {
        $in: categoryArray.map((cat) => new RegExp(`^${cat}$`, "i")),
      };
    }

    // sorting
    const sortOptions = {};
    if (sortByPrice === "lowTohigh") {
      sortOptions.coursePrice = 1;
    } else if (sortByPrice === "highTolow") {
      sortOptions.coursePrice = -1;
    }

    const courses = await Course.find(searchCriteria)
      .populate("creator", "name photoUrl")
      .sort(sortOptions);

    return res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to search courses",
    });
  }
};

export const loadUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.id)
      .select("-password")
      .populate({
        path: "enrolledCourses",
        populate: {
          path: "creator",
          select: "name photoUrl",
        },
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to load user",
    });
  }
};
