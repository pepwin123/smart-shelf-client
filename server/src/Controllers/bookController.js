import Book from "../models/bookModel.js";

export const saveBook = async (req, res) => {
  try {
    const {
      key,
      title,
      author_name,
      first_publish_year,
      cover_i,
      subject,
    } = req.body;

    const book = await Book.create({
      openLibraryId: key,
      title,
      authors: author_name,
      firstPublishYear: first_publish_year,
      coverId: cover_i,
      subjects: subject,
    });

    res.status(201).json({ success: true, book });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Book already saved" });
    }
    res.status(500).json({ success: false, message: "Failed to save book" });
  }
};

export const getSavedBooks = async (req, res) => {
  const books = await Book.find().sort({ createdAt: -1 });
  res.json({ success: true, books });
};
