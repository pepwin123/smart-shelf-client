import axios from "axios";
import BookCache from "../Models/bookCacheModel.js";
import {
  fetchAndCacheBook,
  getBookFromCache,
  getCacheStats,
  clearExpiredCache,
} from "../Services/bookCacheService.js";

// Get book details with caching
export const getBookDetails = async (req, res, next) => {
  try {
    const { openLibraryKey } = req.params;

    if (!openLibraryKey) {
      return res.status(400).json({
        success: false,
        message: "OpenLibrary key required",
      });
    }

    // Try to get from cache first
    let book = await getBookFromCache(openLibraryKey);

    if (!book) {
      // Fetch and cache if not found
      book = await fetchAndCacheBook(openLibraryKey);
    }

    return res.status(200).json({
      success: true,
      book,
      cached: !!book,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch book details",
      error: error.message,
    });
  }
};

// Get multiple books with caching
export const getMultipleBooks = async (req, res, next) => {
  try {
    const { keys } = req.body; // Array of OpenLibrary keys

    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Array of keys required",
      });
    }

    const books = [];
    const cacheStatus = [];

    for (const key of keys) {
      try {
        let book = await getBookFromCache(key);
        const cached = !!book;

        if (!book) {
          book = await fetchAndCacheBook(key);
        }

        books.push(book);
        cacheStatus.push({
          key,
          cached,
          title: book.title,
        });
      } catch (error) {
        console.error(`Error fetching book ${key}:`, error.message);
      }
    }

    return res.status(200).json({
      success: true,
      count: books.length,
      books,
      cacheStatus,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch multiple books",
      error: error.message,
    });
  }
};

// Get cache statistics
export const getCacheStatsEndpoint = async (req, res, next) => {
  try {
    const stats = await getCacheStats();

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get cache stats",
      error: error.message,
    });
  }
};

// Clear expired cache (admin endpoint)
export const clearExpiredCacheEndpoint = async (req, res, next) => {
  try {
    const result = await clearExpiredCache();

    return res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} expired entries`,
      result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to clear cache",
      error: error.message,
    });
  }
};

// Warm cache with popular books (admin endpoint)
export const warmCacheEndpoint = async (req, res, next) => {
  try {
    const { keys } = req.body;

    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Array of keys required",
      });
    }

    const results = [];
    for (const key of keys) {
      try {
        const book = await fetchAndCacheBook(key);
        results.push({
          key,
          title: book.title,
          success: true,
        });
      } catch (error) {
        results.push({
          key,
          success: false,
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Warmed cache with ${results.filter((r) => r.success).length}/${results.length} books`,
      results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to warm cache",
      error: error.message,
    });
  }
};
