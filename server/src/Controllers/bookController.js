import axios from "axios";
import Book from "../Models/bookModel.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mammoth from "mammoth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../../uploads");

export const searchBooks = async (req, res, next) => {
  try {
    const { q, page = 1, subject, year, availability } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const startIndex = (page - 1) * 50;
    const response = await axios.get(
      "https://www.googleapis.com/books/v1/volumes",
      {
        params: {
          q,
          startIndex,
          maxResults: 50,
          orderBy: "relevance",
          key: process.env.GOOGLE_BOOKS_API_KEY || "",
        },
      }
    );

    let books = (response.data.items || []).map((item) => ({
      key: item.id,
      id: item.id,
      title: item.volumeInfo.title || "Unknown Title",
      author_name: item.volumeInfo.authors || [],
      first_publish_year: item.volumeInfo.publishedDate ? new Date(item.volumeInfo.publishedDate).getFullYear() : null,
      cover_url: item.volumeInfo.imageLinks?.medium || item.volumeInfo.imageLinks?.thumbnail || null,
      subject: item.volumeInfo.categories || [],
      has_fulltext: !!item.volumeInfo.previewLink,
      description: item.volumeInfo.description || "",
      pages: item.volumeInfo.pageCount || 0,
      previewLink: item.volumeInfo.previewLink || null,
      isbns: item.volumeInfo.industryIdentifiers?.map(id => id.identifier) || [],
    })) || [];

    // ✅ DATA VALIDATION - Only include books with essential data
    books = books.filter((book) => {
      // Must have title
      if (!book.title || book.title === "Unknown Title") return false;
      // Must have at least one author
      if (!book.author_name || book.author_name.length === 0) return false;
      // Must have cover image OR preview link
      if (!book.cover_url && !book.has_fulltext) return false;
      return true;
    });

    // 📅 YEAR FILTER
    if (year) {
      const y = Number(year);
      books = books.filter(
        (book) =>
          book.first_publish_year &&
          Math.abs(book.first_publish_year - y) <= 1
      );
    }

    // 📘 SUBJECT FILTER
    if (subject) {
      books = books.filter((book) =>
        book.subject?.some((s) =>
          s.toLowerCase().includes(subject.toLowerCase())
        )
      );
    }

    // 📖 AVAILABILITY FILTER
    if (availability === "readable") {
      books = books.filter((book) => book.has_fulltext === true);
    }

    // Limit to top 10 results
    books = books.slice(0, 10);

    res.json({
      success: true,
      count: books.length,
      books,
    });
  } catch (error) {
    next(error);
  }
};

/* 💾 SAVE BOOK */
export const saveBook = async (req, res, next) => {
  try {
    const {
      id,
      key,
      title,
      author_name,
      first_publish_year,
      cover_url,
      subject,
      has_fulltext,
      description,
      pages,
      contentUrl,
      extractedContent,
    } = req.body;

    // For manual books, ensure uniqueness by adding extra randomness if needed
    // Always generate a unique ID - never use null/undefined
    let volumeId = id || key;
    
    if (!volumeId || volumeId === "null" || volumeId === "undefined") {
      // Generate a truly unique ID for manual/new books
      volumeId = `manual-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    } else if (!volumeId.startsWith("manual-")) {
      // For Google Books IDs, keep them as-is, but ensure they're never null
      volumeId = String(volumeId).trim();
    }

    // Final safety check - ensure volumeId is never empty or null
    if (!volumeId || volumeId.trim() === "") {
      volumeId = `manual-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    // Prevent duplicates: if this file/url or volume id already exists, return existing
    try {
      let existing = null;
      if (contentUrl) {
        existing = await Book.findOne({ contentUrl });
      }
      if (!existing) {
        existing = await Book.findOne({ googleBooksVolumeId: volumeId });
      }
      if (existing) {
        return res.status(200).json({
          success: true,
          message: "Book already exists",
          book: existing,
        });
      }

      const book = await Book.create({
        googleBooksVolumeId: volumeId,
        title: title || "Untitled",
        authors: Array.isArray(author_name) ? author_name : (author_name ? [author_name] : []),
        firstPublishYear: first_publish_year || null,
        coverUrl: cover_url || null,
        contentUrl: contentUrl || null,
        extractedContent: extractedContent || null,
        subjects: Array.isArray(subject) ? subject : (subject ? [subject] : []),
        availability: {
          readable: has_fulltext || false,
        },
        description: description || "",
        pageCount: pages || 0,
      });

      res.status(201).json({
        success: true,
        message: "Book saved successfully",
        book,
      });
    } catch (createError) {
      // If duplicate error, try to update existing or return it
      if (createError.code === 11000) {
        console.warn("Duplicate key error, attempting to find existing book:", createError.keyValue);
        const keyVal = createError.keyValue?.googleBooksVolumeId || volumeId;
        const existing = await Book.findOne({ googleBooksVolumeId: keyVal });
        if (existing) {
          return res.status(200).json({
            success: true,
            message: "Book already exists",
            book: existing,
          });
        }
        // If we can't find the existing book, generate a new unique ID and try again
        const newVolumeId = `manual-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const retryBook = await Book.create({
          googleBooksVolumeId: newVolumeId,
          title,
          authors: author_name,
          firstPublishYear: first_publish_year,
          coverUrl: cover_url || null,
          contentUrl: contentUrl || null,
          extractedContent: extractedContent || null,
          subjects: subject,
          availability: {
            readable: has_fulltext,
          },
          description: description || "",
          pageCount: pages || 0,
        });
        return res.status(201).json({
          success: true,
          message: "Book saved successfully",
          book: retryBook,
        });
      }
      throw createError;
    }
  } catch (error) {
    console.error("Save book error:", error.message || error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save book",
    });
  }
};

/* 📚 GET SAVED BOOKS */
export const getSavedBooks = async (req, res, next) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json({ success: true, books });
  } catch (error) {
    next(error);
  }
};

/* 📖 GET BOOK WORK METADATA (Google Books) */
export const getWorkMetadata = async (req, res, next) => {
  try {
    const { workId } = req.params;
    
    // Fetch book details from Google Books API
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes/${workId}`,
      {
        params: {
          key: process.env.GOOGLE_BOOKS_API_KEY || "",
        },
      }
    );
    
    const volumeInfo = response.data.volumeInfo;
    if (!volumeInfo) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({
      title: volumeInfo.title || "Unknown",
      author: volumeInfo.authors?.[0] || "Unknown",
      description: volumeInfo.description || "No description available",
      number_of_pages: volumeInfo.pageCount || 0,
      cover_url: volumeInfo.imageLinks?.medium || volumeInfo.imageLinks?.thumbnail || null,
      readable_url: response.data.selfLink || null,
      has_readable_version: !!volumeInfo.previewLink,
      isbns: volumeInfo.industryIdentifiers?.map(id => id.identifier) || [],
      publisher: volumeInfo.publisher || "Unknown",
      publishedDate: volumeInfo.publishedDate || null,
      language: volumeInfo.language || "en",
      categories: volumeInfo.categories || [],
      previewLink: volumeInfo.previewLink || null,
    });
  } catch (error) {
    next(error);
  }
};

/* 📌 GET BOOK METADATA BY ISBN (Google Books) */
export const getISBNMetadata = async (req, res, next) => {
  try {
    const { isbn } = req.params;
    const response = await axios.get(
      "https://www.googleapis.com/books/v1/volumes",
      {
        params: {
          q: `isbn:${isbn}`,
          maxResults: 1,
          key: process.env.GOOGLE_BOOKS_API_KEY || "",
        },
      }
    );
    
    const item = response.data.items?.[0];
    if (!item) {
      return res.status(404).json({ message: "ISBN not found" });
    }

    const volumeInfo = item.volumeInfo;

    res.json({
      title: volumeInfo.title,
      author: volumeInfo.authors?.[0],
      description: volumeInfo.description || "No description available",
      number_of_pages: volumeInfo.pageCount || 0,
      cover_url: volumeInfo.imageLinks?.medium || volumeInfo.imageLinks?.thumbnail || null,
      isbns: [isbn],
      publisher: volumeInfo.publisher,
      publishedDate: volumeInfo.publishedDate,
    });
  } catch (error) {
    console.error("Error fetching ISBN metadata:", error.message);
    next(error);
  }
};

/* 📤 UPLOAD BOOK FILE (PDF) */
export const uploadBookFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // The server serves uploaded files from /uploads
    const filename = req.file.filename;
    // Prefer explicit SERVER_URL, otherwise build from the incoming request so
    // we return an absolute URL the client can fetch (important in dev).
    const serverUrl = process.env.SERVER_URL || `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${serverUrl}/uploads/${filename}`;

    // Try to extract text for supported types (.txt and .docx)
    const ext = path.extname(filename).toLowerCase();
    let contentText = null;

    try {
      const filePath = path.join(uploadsDir, filename);
      if (ext === ".txt") {
        const data = await fs.readFile(filePath, "utf8");
        contentText = data.slice(0, 20000); // limit size returned
      } else if (ext === ".docx") {
        const result = await mammoth.extractRawText({ path: filePath });
        contentText = (result?.value || "").slice(0, 20000);
      }
    } catch (extractErr) {
      // Non-fatal: just log and continue without extracted text
      console.warn("Failed to extract text from uploaded file:", extractErr.message || extractErr);
    }

    res.json({ success: true, url: fileUrl, filename, contentText });
  } catch (error) {
    next(error);
  }
};

/* 📸 UPLOAD COVER IMAGE */
export const uploadCoverImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // The server serves uploaded files from /uploads
    const filename = req.file.filename;
    const serverUrl = process.env.SERVER_URL || `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${serverUrl}/uploads/${filename}`;

    res.json({ success: true, url: fileUrl, filename });
  } catch (error) {
    next(error);
  }
};

