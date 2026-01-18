import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password | !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email.",
      });
    }
    const hashedpassword = await bcrypt.hash(password, 10);
    const newuser = await User.create({
      name,
      email,
      password: hashedpassword,
      role,
    });
    return res.status(201).json({
      success: true,
      newuser,
      message: "User registered successfully",
    });
  } catch (error) {
    console.log("error in user register", error);
  }
};

// export const login = async (req, res) => {
//   if (!req.body) {
//     return res.status(400).json({
//       success: false,
//       message: "Request body is missing",
//     });
//   }
//   try {
//     const { email, password, role } = req.body;

//     if (!email || !password || !role) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }

//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "Incorrect email or password",
//       });
//     }

//     const isPasswordMatched = await bcrypt.compare(password, user.password);
//     const safeUser = {
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//     };
//     if (!isPasswordMatched) {
//       return res.status(400).json({
//         success: false,
//         message: "Incorrect email or password",
//       });
//     }
//     if (user.role !== role) {
//       return res.status(400).json({
//         success: false,
//         message: "Incorrect role",
//       });
//     }
//     generateToken(res, user, `Welcome back ${user.name}`);

//     // return res.status(200).json({
//     //   success: true,
//     //   safeUser,
//     //   // message: "User logged in successfully",
//     // });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password",
      });
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password",
      });
    }

    if (user.role !== role) {
      return res.status(400).json({
        success: false,
        message: "Incorrect role",
      });
    }

    // ✅ ONLY ONE RESPONSE
    return generateToken(res, user, `Welcome back ${user.name}`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId)
      .select("-password")
      .populate("enrolledCourses");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Profile not found",
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
      message: "Server error",
    });
  }
};

export const logout = async (req, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      success: true,
      message: "logged out successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
export const forgetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { id } = req.params;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("forget password error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.id;
    const name = req.body?.name;
    const profilePhoto = req.file;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // delete old image
    if (user.photoUrl && profilePhoto) {
      const publicId = user.photoUrl.split("/").pop().split(".")[0];
      await deleteMediaFromCloudinary(publicId);
    }

    let photoUrl = user.photoUrl;

    if (profilePhoto) {
      const cloudResponse = await uploadMedia(profilePhoto.path);
      photoUrl = cloudResponse.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, photoUrl },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("update profile error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
