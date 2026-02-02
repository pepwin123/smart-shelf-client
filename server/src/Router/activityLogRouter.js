import express from "express";
import auth from "../Middleware/authMiddleware.js";
import {
  logActivity,
  getWorkspaceActivityLog,
  getUserActivityLog,
  getActivityStats,
  clearOldActivities,
} from "../Controllers/activityLogController.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Log activity
router.post("/", logActivity);

// Get workspace activity log
router.get("/workspace/:workspaceId", getWorkspaceActivityLog);

// Get user activity log
router.get("/user", getUserActivityLog);

// Get activity statistics
router.get("/workspace/:workspaceId/stats", getActivityStats);

// Clear old activities (admin only)
router.post("/admin/clear-old", clearOldActivities);

export default router;
