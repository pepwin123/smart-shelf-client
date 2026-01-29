import express from "express"
import {saveBook, getSavedBooks} from "../Controllers/bookController.js"

const router = express.Router();

router.post("/books", saveBook);
router.get("/books", getSavedBooks);

export default router;