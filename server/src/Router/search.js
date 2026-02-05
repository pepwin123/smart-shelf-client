import express from "express";
import axios from "axios";
import Book from "../Models/bookModel.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const {
      q,
      page = 1
    } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Query required"
      });
    }

    let books = [];

    // Try Google Books API first
    try {
      const startIndex = (page - 1) * 20;
      const response = await axios.get(
        "https://www.googleapis.com/books/v1/volumes",
        {
          params: {
            q,
            startIndex,
            maxResults: 20,
            orderBy: "relevance"
          }
        }
      );

      if (response.data.items) {
        books = response.data.items.map((item) => {
          const volumeInfo = item.volumeInfo;
          return {
            id: item.id,
            key: item.id,
            title: volumeInfo.title,
            author_name: volumeInfo.authors || [],
            first_publish_year: volumeInfo.publishedDate ? new Date(volumeInfo.publishedDate).getFullYear() : null,
            description: volumeInfo.description || "",
            cover_url: volumeInfo.imageLinks?.medium || volumeInfo.imageLinks?.thumbnail || null,
            pageCount: volumeInfo.pageCount || 0,
            categories: volumeInfo.categories || [],
            language: volumeInfo.language || "en",
          };
        });
      }
    } catch (error) {
      console.error("Error searching Google Books API:", error.message);
    }

    // Also search local saved/manual books and merge
    try {
      const dbQuery = {
        $or: [
          { title: { $regex: q, $options: "i" } },
          { authors: { $elemMatch: { $regex: q, $options: "i" } } },
        ],
      };

      const localBooks = await Book.find(dbQuery).limit(50).lean();

      // Map localBooks to same shape as Google Books docs
      const mapped = localBooks.map((b) => ({
        id: b._id.toString(),
        key: b.googleBooksId || b._id.toString(),
        title: b.title,
        author_name: b.authors || [],
        first_publish_year: b.firstPublishYear,
        cover_url: b.coverUrl || null,
        description: b.description || "",
        _manual: true,
      }));

      // Append manual books after remote results
      books = [...books, ...mapped];
    } catch (err) {
      console.error("Error querying local books:", err);
    }

    res.json({
      success: true,
      count: books.length,
      books
    });

  } catch (error) {
    console.error("Search error:", error.message);
    res.status(500).json({
      success: false,
      message: "Search failed"
    });
  }
});

// Search public domain books from Project Gutenberg
router.get("/public-domain", async (req, res) => {
  try {
    const { q, page = 1 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Query required"
      });
    }

    let books = [];

    // Search Project Gutenberg API (Gutendex - free API wrapper)
    try {
      const response = await axios.get(
        "https://gutendex.com/books",
        {
          params: {
            search: q,
          }
        }
      );

      if (response.data.results) {
        books = response.data.results.map((book) => {
          return {
            id: book.id,
            key: `gutenberg-${book.id}`,
            title: book.title,
            author_name: book.authors?.map(a => a.name) || [],
            first_publish_year: null,
            cover_url: book.formats?.["image/jpeg"] || null,
            description: `${book.title} by ${book.authors?.map(a => a.name).join(", ") || "Unknown"}`,
            categories: book.subjects || [],
            language: book.languages?.[0] || "en",
            public_domain: true,
            gutenberg_id: book.id,
            cover_formats: book.formats,
          };
        });
      }
    } catch (error) {
      console.error("Error searching Project Gutenberg:", error.message);
    }

    res.json({
      success: true,
      count: books.length,
      books,
      source: "Project Gutenberg (Public Domain)"
    });

  } catch (error) {
    console.error("Public domain search error:", error.message);
    res.status(500).json({
      success: false,
      message: "Public domain search failed"
    });
  }
});

export default router;
