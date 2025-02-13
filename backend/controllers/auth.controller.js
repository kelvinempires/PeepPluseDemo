import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { generateTokenSetCookies } from "../lib/utils/generateToken.js";
import transporter from "../db/nodeMailer.js";
import {
  // EMAIL_VERIFY_TEMPLATE,
  PASSWORD_RESET_TEMPLATE,
} from "../db/emailtemplate.js";

export const signup = async (req, res) => {
  try {
    const { fullName, username, password, email } = req.body;
    console.log("Received data:", { fullName, username, password, email });

    // Check if all fields are provided
    if (!fullName || !username || !password || !email) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check for existing user by username or email
    const existingUser = await User.findOne({ username });
    const existingEmail = await User.findOne({ email });
    if (existingUser || existingEmail) {
      return res
        .status(400)
        .json({
          error: existingUser
            ? "Username already exists"
            : "Email already exists",
        });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    console.log("Salt generated:", salt);

    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Hashed password:", hashedPassword);

    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
    });
    console.log("New user object created:", newUser);

    // Save the new user and return the response with token
    await newUser.save();
    generateTokenSetCookies(newUser._id, res);

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      username: newUser.username,
      profileImg: newUser.profileImg,
      follower: newUser.follower,
      following: newUser.following,
      email: newUser.email,
      coverImg: newUser.coverImg,
      token, // Include the token in the response
    });
  } catch (err) {
    console.log("Error in signup controller", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};



export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Please provide username and password" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const isCorrectPassword = await bcrypt.compare(password, user.password);
    if (!isCorrectPassword) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    generateTokenSetCookies(user._id, res);

    res.status(200).json({
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      profileImg: user.profileImg,
      follower: user.follower,
      following: user.following,
      email: user.email,
      coverImg: user.coverImg,
      token, // Include the token in the response
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    console.log("User logged out successfully");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller:", error.message);
    res.status(500).send({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getMe controller", error.message);
    res.status(500).json({ error: "internal server error" });
  }
};


export const verifyOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.json({ success: false, msg: "User not found" });
    }
    if (user.isAccountVerified) {
      return res.json({ success: false, msg: "User already verified" });
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send OTP email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account Verification OTP",
      // text: `Your One-Time Password (OTP) is: ${otp}`,
      html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace(
        "{{email}}",
        user.email
      ),
    };
    await transporter.sendMail(mailOptions);
    res.json({ success: true, msg: "verification otp sent on email " });
  } catch (error) {
    res.json({ success: false, msg: error.message });
    console.error("Error in verifyOtp controller:", error);
  }
};

// Verify the email using the OTP
export const login_verifyOtp = async (req, res) => {
  const { userId, otp } = req.body;

  // Validate input
  if (!userId || !otp) {
    return res.json({ success: false, msg: "Please provide userId and OTP" });
  }

  try {
    // Find user by ID
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.json({ success: false, msg: "User not found" });
    }

    // Check if OTP is valid and not expired
    if (user.verifyOtp === "" || user.verifyOtp !== otp) {
      return res.json({ success: false, msg: "Invalid  OTP" });
    }
    if (user.verifyOtpExpireAt < Date.now()) {
      return res.json({ success: false, msg: "expired OTP" });
    }

    // Mark user as verified and clear OTP fields
    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;
    await user.save();

    // Generate token and set cookie
    const token = generateToken(user._id);
    setCookie(res, token);

    return res.json({ success: true, msg: "Email verification successful" });
  } catch (error) {
    return res.json({ success: false, msg: error.message });
  }
};
export const isAuthenticated = async (req, res) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    res.json({ success: false, msg: error.message });
  }
};
// send password reset otp
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.json({ success: false, msg: "Please provide email" });
  }

  try {
    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, msg: "User not found" });
    }

    // Generate and save OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send OTP email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Password Reset OTP",
      // text: `Your One-Time Password (OTP) is: ${otp} use it to reset your password`,
      html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace(
        "{{email}}",
        user.email
      ),
    };
    await transporter.sendMail(mailOptions);
    res.json({ success: true, msg: "OTP sent successfully" });
  } catch (error) {
    res.json({ success: false, msg: "Error in sendResetOtp controller" });
  }
};

// reset User password

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      msg: "Please provide email, OTP, and new password",
    });
  }

  try {
    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }
    if (user.resetOtp === "" || user.resetOtp !== otp) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid or expired OTP" });
    }

    // Check if OTP is valid and not expired
    if (user.resetOtpExpireAt < Date.now()) {
      return res.status(400).json({ success: false, msg: "expired OTP" });
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;
    await user.save();
    res.json({ success: true, msg: "Password reset successful" });
  } catch (error) {
    console.error("Error in resetPassword controller:", error);
    res
      .status(500)
      .json({ success: false, msg: "Error in resetPassword controller" });
  }
};

