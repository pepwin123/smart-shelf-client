import mongoose from "mongoose";

const bookCacheSchema = new mongoose.Schema(
  {
    openLibraryKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: String,
    authors: [String],
    isbn: [String],
    isbn10: [String],
    isbn13: [String],
    firstPublishYear: Number,
    publishYear: Number,
    pages: Number,
    coverId: Number,
    coverUrl: String, // Pre-built URL for quick access
    subjects: [String],
    genres: [String],
    description: String,
    ratings: {
      average: Number,
      count: Number,
    },
    availability: {
      readable: Boolean,
      borrowable: Boolean,
      fullText: Boolean,
    },
    languages: [String],
    publisherName: [String],
    editionCount: Number,
    firstEdition: {
      year: Number,
      title: String,
    },
    // Metadata for tracking
    cacheHits: {
      type: Number,
      default: 0,
    },
    lastFetchedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  },
  { timestamps: true }
);

// Index for cache expiration
bookCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to increment cache hit
bookCacheSchema.methods.incrementHit = function () {
  this.cacheHits += 1;
  this.lastFetchedAt = new Date();
  return this.save();
};

// Method to refresh expiration
bookCacheSchema.methods.refreshExpiration = function () {
  this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return this.save();
};

// Static method to find or create
bookCacheSchema.statics.findOrCreate = async function (openLibraryKey, data) {
  let book = await this.findOne({ openLibraryKey });

  if (book) {
    await book.incrementHit();
    await book.refreshExpiration();
  } else {
    book = await this.create({
      openLibraryKey,
      ...data,
      cacheHits: 1,
    });
  }

  return book;
};

const BookCache = mongoose.models.BookCache || mongoose.model("BookCache", bookCacheSchema);

export default BookCache;
