import express from "express";
import auth from "../Middleware/authMiddleware.js";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateCardPosition,
  addCard,
  deleteCard,
  deleteWorkspace,
} from "../Controllers/workspaceController.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Workspace CRUD
router.post("/", createWorkspace);
router.get("/", getWorkspaces);
router.get("/:workspaceId", getWorkspace);
router.delete("/:workspaceId", deleteWorkspace);

// Card operations
router.patch("/:workspaceId/move-card", updateCardPosition);
router.post("/:workspaceId/cards", addCard);
router.delete("/:workspaceId/cards", deleteCard);

export default router;
