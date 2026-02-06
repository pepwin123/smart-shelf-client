import express from "express";
import auth from "../Middleware/authMiddleware.js";
import {
  getBookDetails,
  getCacheStatsEndpoint,
  clearExpiredCacheEndpoint,
} from "../Controllers/bookCacheController.js";

const router = express.Router();

// Public routes
router.get("/:googleBooksVolumeId", getBookDetails);

// Protected routes (cache stats, management)
router.get("/admin/stats", auth, getCacheStatsEndpoint);
router.post("/admin/clear-expired", auth, clearExpiredCacheEndpoint);

export default router;
