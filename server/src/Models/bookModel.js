import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
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
    firstPublishYear: Number,
    publishedDate: String,
    coverUrl: String,
    contentUrl: String,
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

const Book = mongoose.models.Book || mongoose.model("Book", bookSchema);
export default Book;
