import jwt from "jsonwebtoken";

export const generateTokenSetCookies = (userId, res) => {
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "15d",
    });

    res.cookie("jwt", token, {
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
      httpOnly: true, // Prevents cross-site scripting attacks
      sameSite: "strict",
      secure: process.env.MODE_ENV !== "development",
    });

    console.log("Token generated and cookie set successfully.");
  } catch (error) {
    console.error("Error generating token or setting cookie:", error);
    res.status(500).json("Internal server error");
  }
};
