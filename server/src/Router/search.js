import express from "express";
import axios from "axios";
import Book from "../Models/bookModel.js";

const router = express.Router();

// Simple in-memory cache for search results (key -> { expires, data })
const searchCache = new Map();
const SEARCH_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

router.get("/", async (req, res) => {
  try {
    // Read API key dynamically from environment (not at module load time)
    const GOOGLE_API_KEY = process.env.GOOGLE_BOOKS_API_KEY || "";
    
    const {
      q,
      page = 1,
      year,
      category,
      availability
    } = req.query;

    // Require at least a query OR filters
    if (!q && !year && !category && !availability) {
      return res.status(400).json({
        success: false,
        message: "Provide a search query or at least one filter"
      });
    }

    // Validate and parse year if provided
    let yearNum = null;
    if (year) {
      yearNum = parseInt(year, 10);
      // Validate year is a reasonable number (between 1000 and future +10 years)
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1000 || yearNum > currentYear + 10) {
        // Return empty results instead of error for invalid year
        console.warn(`Invalid year provided: ${year}`);
        yearNum = null;
      }
    }

    let books = [];

    // Try Google Books API first (with simple caching and retry on 429) - only if we have a query
    if (q) {
      try {
        const startIndex = (page - 1) * 20;
        const cacheKey = `search:${q}:${page}`;

        // Return cached result if present and not expired
        const cached = searchCache.get(cacheKey);
        if (cached && cached.expires > Date.now()) {
          books = cached.data;
        } else {
          const url = "https://www.googleapis.com/books/v1/volumes";
          let response = null;
          let attempt = 0;
          const maxAttempts = 3;

          while (attempt < maxAttempts) {
            try {
              const params = {
                q,
                startIndex,
                maxResults: 20,
                orderBy: "relevance",
                ...(GOOGLE_API_KEY ? { key: GOOGLE_API_KEY } : {}),
              };
              console.log(`   📡 Requesting: ${url}?q=${q}&key=${GOOGLE_API_KEY ? 'SET' : 'MISSING'}`);
              response = await axios.get(url, { params });
              break; // success
            } catch (err) {
              const status = err.response?.status;
              const errorData = err.response?.data;
              console.error(`   ❌ Attempt ${attempt + 1}: ${status} - ${err.message}`);
              if (errorData) console.error(`      Error details: ${JSON.stringify(errorData)}`);
              
              if (status === 429) {
                // Rate limited: exponential backoff
                const backoff = 500 * Math.pow(2, attempt);
                console.warn(`   🔄 Rate-limited, backing off ${backoff}ms`);
                const retryAfter = err.response?.headers?.['retry-after'];
                if (retryAfter) {
                  await sleep(parseInt(retryAfter, 10) * 1000);
                } else {
                  await sleep(backoff);
                }
                attempt += 1;
                continue;
              }
              // For other errors (401, 403, etc), break and allow local fallback
              console.error(`   🛑 Not retrying for status ${status} — using local fallback`);
              break;
            }
          }

          if (response && response.data && response.data.items) {
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
            }).filter((book) => {
              // ✅ Filter: Only include books where search query matches title or author
              const queryLower = q.toLowerCase();
              const titleMatch = book.title?.toLowerCase().includes(queryLower);
              const authorMatch = book.author_name?.some(author => 
                author.toLowerCase().includes(queryLower)
              );
              return titleMatch || authorMatch;
            });

            // cache the search results
            searchCache.set(cacheKey, {
              expires: Date.now() + SEARCH_CACHE_TTL_MS,
              data: books,
            });
          }
        }
      } catch (error) {
        console.error("Error searching Google Books API:", error.message);
      }
    }

    // Also search local saved/manual books and merge
    try {
      const dbQuery = {};
      
      // Build query based on search parameters
      if (q) {
        dbQuery.$or = [
          { title: { $regex: q, $options: "i" } },
          { authors: { $elemMatch: { $regex: q, $options: "i" } } },
        ];
      }

      // Add year filter if provided
      if (yearNum) {
        dbQuery.firstPublishYear = {
          $gte: yearNum,
          $lte: yearNum + 1 // Allow 1-year range for flexibility
        };
      }

      // Add category filter if provided
      if (category) {
        dbQuery.subjects = { $regex: category, $options: "i" };
      }

      // Add availability filter if provided
      if (availability === "readable") {
        dbQuery.contentUrl = { $exists: true, $ne: null };
      }

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
        categories: b.subjects || [],
        _manual: true,
        hasPreview: !!b.contentUrl,
      }));

      // Append manual books after remote results
      books = [...books, ...mapped];
    } catch (err) {
      console.error("❌ Local books query error:", err.message);
    }

    // Apply filters to Google Books results
    books = books.filter((book) => {
      // Year filter
      if (yearNum) {
        const bookYear = book.first_publish_year;
        if (!bookYear || bookYear < yearNum || bookYear > yearNum + 1) {
          return false;
        }
      }

      // Category filter
      if (category) {
        const bookCategories = book.categories || [];
        const categoryMatch = bookCategories.some(cat =>
          cat.toLowerCase().includes(category.toLowerCase())
        );
        if (!categoryMatch) {
          return false;
        }
      }

      // Availability filter
      if (availability === "readable") {
        if (!book.hasPreview && !book._manual) {
          return false;
        }
      }

      return true;
    });

    console.log(`📤 Returning ${books.length} total books`);
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

export default router;
