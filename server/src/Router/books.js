import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  searchBooks,
  saveBook,
  getSavedBooks,
  getWorkMetadata,
  getISBNMetadata,
  uploadBookFile,
  uploadCoverImage,
} from "../controllers/bookController.js";

const router = express.Router();

// Determine uploads directory relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed"));
    } else {
      cb(null, true);
    }
  },
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB for images
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
    } else {
      cb(null, true);
    }
  },
});

router.get("/search", searchBooks);
router.post("/books", saveBook);
router.post("/upload", upload.single("file"), uploadBookFile);
router.post("/upload-cover", uploadImage.single("file"), uploadCoverImage);
router.get("/books", getSavedBooks);
router.get("/work/:workId", getWorkMetadata);
router.get("/isbn/:isbn", getISBNMetadata);

export default router;

