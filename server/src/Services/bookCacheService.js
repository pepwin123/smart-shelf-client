import axios from "axios";
import BookCache from "../Models/bookCacheModel.js";

// Fetch from OpenLibrary and cache
export const fetchAndCacheBook = async (openLibraryKey) => {
  try {
    // Normalize the key - extract just the ID if it includes /works/ or /books/ prefix
    const normalizedKey = openLibraryKey.includes('/') 
      ? openLibraryKey.split('/').pop() 
      : openLibraryKey;
    
    // Build the full path for the API call
    const apiPath = openLibraryKey.includes('/') 
      ? openLibraryKey 
      : `/works/${normalizedKey}`;

    // Check cache first using normalized key
    const existing = await BookCache.findOne({ openLibraryKey: normalizedKey });
    if (existing) {
      await existing.incrementHit();
      console.log(`Cache HIT for ${normalizedKey}`);
      return existing;
    }

    // Fetch from OpenLibrary
    const response = await axios.get(
      `https://openlibrary.org${apiPath}.json`
    );

    const bookData = response.data;

    // Extract and structure data
    const cacheData = {
      openLibraryKey: normalizedKey,
      title: bookData.title,
      authors: bookData.authors?.map((a) => a.name) || [],
      isbn: bookData.isbn || [],
      isbn10: bookData.isbn_10 || [],
      isbn13: bookData.isbn_13 || [],
      firstPublishYear: bookData.first_publish_year,
      publishYear: bookData.publish_year,
      pages: bookData.number_of_pages,
      coverId: bookData.covers?.[0],
      coverUrl: bookData.covers?.[0]
        ? `https://covers.openlibrary.org/b/id/${bookData.covers[0]}-M.jpg`
        : null,
      subjects: bookData.subjects || [],
      genres: bookData.genres || [],
      description: bookData.description?.value || bookData.description || "",
      languages: bookData.languages?.map((l) => l.key) || [],
      publisherName: bookData.publishers || [],
      editionCount: bookData.edition_count,
    };

    // Cache it
    const created = await BookCache.create(cacheData);
    console.log(`Cache MISS - Fetched and cached ${normalizedKey}`);
    return created;
  } catch (error) {
    console.error(`Error fetching book ${openLibraryKey}:`, error.message);
    throw error;
  }
};

// Get book from cache with availability
export const getBookFromCache = async (openLibraryKey) => {
  try {
    // Normalize the key
    const normalizedKey = openLibraryKey.includes('/') 
      ? openLibraryKey.split('/').pop() 
      : openLibraryKey;
      
    const book = await BookCache.findOne({ openLibraryKey: normalizedKey });
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