import express from "express";
import auth from "../Middleware/authMiddleware.js";
import {
  getBookDetails,
  getMultipleBooks,
  getCacheStatsEndpoint,
  clearExpiredCacheEndpoint,
  warmCacheEndpoint,
} from "../Controllers/bookCacheController.js";

const router = express.Router();

// Public routes
router.get("/:openLibraryKey", getBookDetails);
router.post("/multiple", getMultipleBooks);

// Protected routes (cache stats, management)
router.get("/admin/stats", auth, getCacheStatsEndpoint);
router.post("/admin/clear-expired", auth, clearExpiredCacheEndpoint);
router.post("/admin/warm-cache", auth, warmCacheEndpoint);

export default router;
