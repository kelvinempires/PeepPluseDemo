import express, { Router } from "express";
import { getMe, login, logout, signup } from "../controllers/auth.controller.js";
import protectRoute from "../lib/utils/protectRout.js";

const router = express.Router();

router.get("/me", protectRoute, getMe);

router.post("/signup", signup);

router.post("/login", login);

router.post("/logout", logout);

export default router;
