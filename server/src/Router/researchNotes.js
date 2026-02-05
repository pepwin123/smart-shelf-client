import express from "express";
import auth from "../Middleware/authMiddleware.js";
import {
  createNote,
  getNotesByBook,
  updateNote,
  deleteNote,
} from "../Controllers/researchNoteController.js";

const router = express.Router();

// Public GET endpoint
router.get("/book/:openLibraryKey", getNotesByBook);

// Protected endpoints (require authentication)
router.use(auth);

router.post("/", createNote);
router.patch("/:id", updateNote);
router.delete("/:id", deleteNote);

export default router;
