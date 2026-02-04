import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    openLibraryId: {
      type: String,
      required: true,
      unique: true,
    },
    title: String,
    authors: [String],
    firstPublishYear: Number,
    coverId: Number,
    coverUrl: String,
    subjects: [String],
    availability: {
      readable: Boolean,
      borrowable: Boolean,
    },
  },
  { timestamps: true }
);

const Book = mongoose.models.Book || mongoose.model("Book", bookSchema);
export default Book;
