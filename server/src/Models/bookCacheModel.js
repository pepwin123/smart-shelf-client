import mongoose from "mongoose";

const bookCacheSchema = new mongoose.Schema(
  {
    googleBooksVolumeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      description: "Google Books volume ID (e.g., zyTCAlFPjgYC)",
    },
    title: String,
    authors: [String],
    isbn10: String,
    isbn13: String,
    publishedDate: String,
    publishYear: Number,
    pageCount: Number,
    coverUrl: String,
    subjects: [String],
    description: String,
    language: String,
    publisher: String,
    ratingsAverage: Number,
    ratingsCount: Number,
    accessInfo: {
      viewability: String,
      embeddable: Boolean,
      publicDomain: Boolean,
    },
    previewLink: String,
    infoLink: String,
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
bookCacheSchema.statics.findOrCreate = async function (googleBooksVolumeId, data) {
  let book = await this.findOne({ googleBooksVolumeId });

  if (book) {
    await book.incrementHit();
    await book.refreshExpiration();
  } else {
    book = await this.create({
      googleBooksVolumeId,
      ...data,
      cacheHits: 1,
    });
  }

  return book;
};

const BookCache = mongoose.models.BookCache || mongoose.model("BookCache", bookCacheSchema);

export default BookCache;
