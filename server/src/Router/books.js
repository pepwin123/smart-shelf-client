import express from "express";
import {
  searchBooks,
  saveBook,
  getSavedBooks,
} from "../controllers/bookController.js";

const router = express.Router();

router.get("/search", searchBooks);
router.post("/books", saveBook);
router.get("/books", getSavedBooks);

export default router;
