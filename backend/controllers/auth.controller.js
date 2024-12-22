import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { generateTokenSetCookies } from "../lib/utils/generateToken.js";

export const signup = async (req, res) => {
  try {
    const { fullName, username, password, email } = req.body;
    console.log("Received data:", { fullName, username, password, email }); // Log input data

    // Check if all fields are provided
    if (!fullName || !username || !password || !email) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "invalid email format" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "username already exists" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "password must be at lest 6 characters" });
    }

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    console.log("Salt generated:", salt); // Log salt

    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Hashed password:", hashedPassword); // Log hashed password

    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
    });
    console.log("New user object created:", newUser); // Log new user object

    if (newUser) {
      generateTokenSetCookies(newUser._id, res);
      await newUser.save();
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        profileImg: newUser.profileImg,
        follower: newUser.follower,
        following: newUser.following,
        email: newUser.email,
        coverImg: newUser.coverImg,
      });
    } else {
      res.status(400).json({ error: "invalid user data" });
    }
  } catch (err) {
    console.log("error in signup controller", err.message);
    res.status(500).send({ err: "internal server err" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password ) {
      return res.status(400).json({error:"Please provide username and password"});
    }
    const user = await User.findOne({ username });
    const isCorrectPassword = await bcrypt.compare(
      password,
      user?.password || ""
    );
    if (!user || !isCorrectPassword) {
      return res.status(400).json({ error: "Invalid username or password" });
    }
    generateTokenSetCookies(user._id, res);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      profileImg: user.profileImg,
      follower: user.follower,
      following: user.following,
      email: user.email,
      coverImg: user.coverImg,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);

    res.status(500).json({ error: "internal server Error" });
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
