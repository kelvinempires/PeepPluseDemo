import express from "express";
import protectRoute from "../lib/utils/protectRout.js";
import { deleteNotifications, getNotifications } from "../controllers/notification.controller.js";

const router = express.Router();
router.get("/", protectRoute, getNotifications);
router.delete("/", protectRoute, deleteNotifications);
// router.delete("/:id", protectRoute, deleteOneNotification);


export default router;
