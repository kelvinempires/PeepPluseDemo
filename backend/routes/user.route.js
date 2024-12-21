import express, { Router } from "express";
import protectRoute from "../lib/utils/protectRout.js";
import {followUnfollowUser, getUserProfile, grtSuggestedUsers, updateUser,} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile/:username", protectRoute, getUserProfile);
 router.get("/suggested", protectRoute, grtSuggestedUsers);
router.post("/followed/:id", protectRoute, followUnfollowUser);
router.post("/update", protectRoute, updateUser);

export default router;
