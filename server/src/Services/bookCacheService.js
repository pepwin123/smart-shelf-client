import axios from "axios";
import BookCache from "../Models/bookCacheModel.js";

// Fetch from Google Books API and cache
export const fetchAndCacheBook = async (googleBooksId) => {
  try {
    // Normalize the ID
    const normalizedId = googleBooksId;
    
    // Check cache first
    const existing = await BookCache.findOne({ googleBooksId: normalizedId });
    if (existing) {
      await existing.incrementHit();
      console.log(`Cache HIT for ${normalizedId}`);
      return existing;
    }

    // Fetch from Google Books API
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes/${googleBooksId}`
    );

    const volumeInfo = response.data.volumeInfo;

    // Extract and structure data
    const cacheData = {
      googleBooksId: normalizedId,
      title: volumeInfo.title,
      authors: volumeInfo.authors || [],
      isbn: volumeInfo.industryIdentifiers?.map(id => id.identifier) || [],
      firstPublishYear: volumeInfo.publishedDate ? new Date(volumeInfo.publishedDate).getFullYear() : null,
      publishYear: volumeInfo.publishedDate ? new Date(volumeInfo.publishedDate).getFullYear() : null,
      pages: volumeInfo.pageCount,
      coverUrl: volumeInfo.imageLinks?.medium || volumeInfo.imageLinks?.thumbnail || null,
      subjects: volumeInfo.categories || [],
      genres: volumeInfo.categories || [],
      description: volumeInfo.description || "",
      languages: [volumeInfo.language || "en"],
      publisherName: volumeInfo.publisher ? [volumeInfo.publisher] : [],
      editionCount: 1,
    };

    // Cache it
    const created = await BookCache.create(cacheData);
    console.log(`Cache MISS - Fetched and cached ${normalizedId}`);
    return created;
  } catch (error) {
    console.error(`Error fetching book ${googleBooksId}:`, error.message);
    throw error;
  }
};

// Get book from cache with availability
export const getBookFromCache = async (googleBooksId) => {
  try {
    // Normalize the ID
    const normalizedId = googleBooksId;
      
    const book = await BookCache.findOne({ googleBooksId: normalizedId });
    if (book) {
      await book.incrementHit();
    }
    return book;
  } catch (error) {
    console.error("Error getting cached book:", error);
    return null;
  }
};

// Get cache stats
export const getCacheStats = async () => {
  try {
    const totalBooks = await BookCache.countDocuments();
    const totalCacheHits = await BookCache.aggregate([
      {
        $group: {
          _id: null,
          totalHits: { $sum: "$cacheHits" },
        },
      },
    ]);

    const topBooks = await BookCache.find()
      .sort({ cacheHits: -1 })
      .limit(10)
      .select("title cacheHits");

    return {
      totalCachedBooks: totalBooks,
      totalCacheHits: totalCacheHits[0]?.totalHits || 0,
      topBooks,
    };
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return null;
  }
};

// Clear expired cache
export const clearExpiredCache = async () => {
  try {
    const result = await BookCache.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    console.log(`Cleared ${result.deletedCount} expired cache entries`);
    return result;
  } catch (error) {
    console.error("Error clearing expired cache:", error);
  }
};

// Warm cache with popular books (optional)
export const warmCache = async (openLibraryKeys) => {
  try {
    const results = [];
    for (const key of openLibraryKeys) {
      const book = await fetchAndCacheBook(key);
      results.push(book);
    }
    console.log(`Warmed cache with ${results.length} books`);
    return results;
  } catch (error) {
    console.error("Error warming cache:", error);
  }
};