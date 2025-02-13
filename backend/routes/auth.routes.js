import express, { Router } from "express";
import { getMe, isAuthenticated, login, logout, resetPassword, sendResetOtp, signup } from "../controllers/auth.controller.js";
import protectRoute from "../lib/utils/protectRout.js";
import userAuth from "../middleWare/userAuth.js";

const router = express.Router();

router.get("/me", protectRoute, getMe);

router.post("/signup", signup);

router.post("/login", login);

router.post("/logout", logout);

router.get("/is-auth", userAuth, isAuthenticated);
router.post("/send-reset-otp", sendResetOtp);
router.post("/reset-password", resetPassword);

export default router;
