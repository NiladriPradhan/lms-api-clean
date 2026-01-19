// import jwt from "jsonwebtoken";
// export const generateToken = (res, user, message) => {
//   const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
//     expiresIn: "1h",
//   });

//   return res.status(200).cookie("token", token, {
//     httpOnly: true,
//     sameSite: "strict",
//     secure: true,
//     maxAge: 60 * 60 * 1000,
//   }).json({
//     success: true,
//     message,
//     user
//   })
// };

import jwt from "jsonwebtoken";

export const generateToken = (res, user, message) => {
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  const isProd = process.env.NODE_ENV === "production";

  return res
    .status(200)
    .cookie("token", token, {
      httpOnly: true,
      secure: isProd, // ✅ false on localhost
      sameSite: isProd ? "none" : "lax", // ✅ works in both
      maxAge: 60 * 60 * 1000,
    })
    .json({
      success: true,
      message,
      user,
    });
};
