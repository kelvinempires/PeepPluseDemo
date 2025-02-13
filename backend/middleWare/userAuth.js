import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const userAuth = (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return res
      .status(401)
      .json({ success: false, msg: "Not Authorized, please login again" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.id) {
      req.body.userId = decoded.id;
      next();
    } else {
      return res
        .status(401)
        .json({ success: false, msg: "Not Authorized, please login again" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message }); // Return the actual error message with status code
  }
};

export default userAuth;
