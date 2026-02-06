import axios from "axios";
import BookCache from "../Models/bookCacheModel.js";

// Get book details with caching (Google Books)
export const getBookDetails = async (req, res, next) => {
  try {
    const { googleBooksVolumeId } = req.params;

    if (!googleBooksVolumeId) {
      return res.status(400).json({
        success: false,
        message: "Google Books volume ID required",
      });
    }

    // Try to get from cache first
    let book = await BookCache.findOne({ googleBooksVolumeId });

    if (book) {
      await book.incrementHit();
      return res.status(200).json({
        success: true,
        book,
        cached: true,
      });
    }

    // Fetch from Google Books API if not cached
    try {
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes/${googleBooksVolumeId}`,
        {
          params: {
            key: process.env.GOOGLE_BOOKS_API_KEY || "",
          },
        }
      );

      const volumeInfo = response.data.volumeInfo;
      const accessInfo = response.data.accessInfo;

      const cachedBook = await BookCache.create({
        googleBooksVolumeId,
        title: volumeInfo.title,
        authors: volumeInfo.authors || [],
        publishedDate: volumeInfo.publishedDate,
        publishYear: volumeInfo.publishedDate ? new Date(volumeInfo.publishedDate).getFullYear() : null,
        pageCount: volumeInfo.pageCount,
        coverUrl: volumeInfo.imageLinks?.medium || volumeInfo.imageLinks?.thumbnail || null,
        subjects: volumeInfo.categories || [],
        description: volumeInfo.description,
        language: volumeInfo.language,
        publisher: volumeInfo.publisher,
        isbn10: volumeInfo.industryIdentifiers?.find(id => id.type === "ISBN_10")?.identifier,
        isbn13: volumeInfo.industryIdentifiers?.find(id => id.type === "ISBN_13")?.identifier,
        ratingsAverage: volumeInfo.averageRating,
        ratingsCount: volumeInfo.ratingsCount,
        accessInfo: {
          viewability: accessInfo?.viewability,
          embeddable: accessInfo?.embeddable,
          publicDomain: accessInfo?.publicDomain,
        },
        previewLink: volumeInfo.previewLink,
        infoLink: response.data.selfLink,
      });

      return res.status(200).json({
        success: true,
        book: cachedBook,
        cached: false,
      });
    } catch (fetchError) {
      if (fetchError.response?.status === 404) {
        return res.status(404).json({
          success: false,
          message: "Book not found in Google Books",
        });
      }
      throw fetchError;
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch book details",
      error: error.message,
    });
  }
};

// Get cache statistics
export const getCacheStatsEndpoint = async (req, res, next) => {
  try {
    const stats = await BookCache.aggregate([
      {
        $group: {
          _id: null,
          totalCached: { $sum: 1 },
          totalHits: { $sum: "$cacheHits" },
          avgHits: { $avg: "$cacheHits" },
        },
      },
    ]);

    const expiringSoon = await BookCache.countDocuments({
      expiresAt: {
        $gt: new Date(),
        $lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return res.status(200).json({
      success: true,
      stats: stats[0] || { totalCached: 0, totalHits: 0, avgHits: 0 },
      expiringSoon,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get cache statistics",
      error: error.message,
    });
  }
};

// Clear expired cache entries
export const clearExpiredCacheEndpoint = async (req, res, next) => {
  try {
    const result = await BookCache.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    return res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Cleared ${result.deletedCount} expired entries`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to clear expired cache",
      error: error.message,
    });
  }
};
