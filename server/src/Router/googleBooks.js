import express from "express";
import axios from "axios";
import Book from "../Models/bookModel.js";

const router = express.Router();

const GOOGLE_BASE = "https://www.googleapis.com/books/v1/volumes";

// Simple in-memory cache for volume metadata
const volumeCache = new Map();
const VOLUME_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// GET /api/google-books/volumes/:id
// Fetch volume metadata including accessInfo, with simple retry and cache
router.get("/volumes/:id", async (req, res) => {
  try {
    // Read API key dynamically from environment
    const API_KEY = process.env.GOOGLE_BOOKS_API_KEY || "";
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing volume id" });

    // If this is a locally created manual book id (starts with 'manual-'),
    // or the client accidentally passed a MongoDB ObjectId for a stored Book,
    // return stored metadata from DB instead of calling Google Books.
    try {
      if (id.startsWith("manual-")) {
        const book = await Book.findOne({ googleBooksVolumeId: id }).lean();
        if (book) {
          const volumeLike = {
            id: book.googleBooksVolumeId,
            volumeInfo: {
              title: book.title || "",
              authors: book.authors || [],
              description: book.description || "",
              pageCount: book.pageCount || 0,
              imageLinks: book.coverUrl ? { thumbnail: book.coverUrl, medium: book.coverUrl } : undefined,
            },
            accessInfo: {},
            contentUrl: book.contentUrl || null,
            extractedContent: book.extractedContent || null,
          };
          return res.json(volumeLike);
        }
      }

      // If id looks like a MongoDB ObjectId, try to resolve it to a Book record
      if (/^[0-9a-fA-F]{24}$/.test(id)) {
        const bookById = await Book.findById(id).lean();
        if (bookById) {
          const volumeLike = {
            id: bookById.googleBooksVolumeId || bookById._id.toString(),
            volumeInfo: {
              title: bookById.title || "",
              authors: bookById.authors || [],
              description: bookById.description || "",
              pageCount: bookById.pageCount || 0,
              imageLinks: bookById.coverUrl ? { thumbnail: bookById.coverUrl, medium: bookById.coverUrl } : undefined,
            },
            accessInfo: {},
            contentUrl: bookById.contentUrl || null,
            extractedContent: bookById.extractedContent || null,
          };
          return res.json(volumeLike);
        }
      }
    } catch (dbErr) {
      console.error("Error fetching manual/book metadata in google-books route:", dbErr.message || dbErr);
      // fall through to normal behavior
    }

    // Try candidate ids: the stored id and, if it starts with '-', the id without leading hyphen.
    const candidates = [id];
    if (id.startsWith("-")) candidates.push(id.slice(1));

    let lastErr = null;
    for (const candidateId of candidates) {
      const cacheKey = `volume:${candidateId}`;
      const cached = volumeCache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        return res.json(cached.data);
      }

      const url = `${GOOGLE_BASE}/${encodeURIComponent(candidateId)}`;
      let attempt = 0;
      const maxAttempts = 3;

      while (attempt < maxAttempts) {
        try {
          const response = await axios.get(url, {
            params: {
              ...(API_KEY ? { key: API_KEY } : {}),
            },
          });

          // Cache and return for this candidate
          volumeCache.set(cacheKey, {
            expires: Date.now() + VOLUME_CACHE_TTL,
            data: response.data,
          });

          return res.json(response.data);
        } catch (err) {
          lastErr = err;
          const status = err.response?.status;

          // If volume not found (404) or bad request (400) try the next candidate instead of immediately returning
          if (status === 404 || status === 400) {
            console.warn(`⚠️ Volume not found for candidate ${candidateId}: (${status}), trying next candidate if available`);
            break; // break out of retry loop and try next candidate
          }

          if (status === 429) {
            const retryAfter = err.response?.headers?.["retry-after"];
            const backoff = 500 * Math.pow(2, attempt);
            console.warn(`🔄 Rate-limited on attempt ${attempt + 1}, backing off...`);
            if (retryAfter) await sleep(parseInt(retryAfter, 10) * 1000);
            else await sleep(backoff);
            attempt += 1;
            continue;
          }

          // For other errors break and try the next candidate
          break;
        }
      }
    }

    console.error("Failed to fetch volume for candidates:", lastErr?.message || "unknown");
    return res.status(500).json({ error: "Failed to fetch volume metadata" });
  } catch (error) {
    console.error("Volume endpoint error:", error.message);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
