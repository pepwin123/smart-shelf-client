import express from "express";
import {
  addBookToShelf,
  getShelfByWorkspace,
  moveBook,
  removeBook,
} from "../controllers/shelf.controller.js";
import auth from "../middleware/auth.js";
import isWorkspaceMember from "../Middleware/isWorkspaceMember.js";

const router = express.Router();

router.post("/", auth, isWorkspaceMember, addBookToShelf);
router.get("/:workspaceId", auth, isWorkspaceMember, getShelfByWorkspace);
router.patch("/:id/move", auth, moveBook);
router.delete("/:id", auth, removeBook);

export default router;
