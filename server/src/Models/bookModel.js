import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    googleBooksVolumeId: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      index: true,
      description: "Google Books volume ID (e.g., zyTCAlFPjgYC)",
    },
    title: String,
    authors: [String],
    firstPublishYear: Number,
    publishedDate: String,
    coverUrl: String,
    contentUrl: String,
    extractedContent: String,
    subjects: [String],
    description: String,
    pageCount: Number,
    language: String,
    publisher: String,
    isbn10: String,
    isbn13: String,
    availability: {
      readable: Boolean,
      embeddable: Boolean,
    },
    accessInfo: {
      viewability: String,
      embeddable: Boolean,
      publicDomain: Boolean,
    },
  },
  { timestamps: true }
);

// Drop any old indexes that might be causing issues
bookSchema.pre('init', function(next) {
  next();
});

const Book = mongoose.models.Book || mongoose.model("Book", bookSchema);

// Drop old problematic indexes on startup
if (typeof Book.collection !== 'undefined') {
  Book.collection.dropIndex('openLibraryId_1').catch(() => {
    // Index might not exist, that's fine
  });
}

export default Book;
