import axios from "axios";
import Book from "../models/bookModel.js";

export const searchBooks = async (req, res, next) => {
  try {
    const { q, page = 1, subject, year, availability } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const response = await axios.get(
      "https://openlibrary.org/search.json",
      {
        params: {
          q,
          page,
          limit: 10,
          fields:
            "key,title,author_name,first_publish_year,cover_i,subject,has_fulltext,public_scan_b",
        },
      }
    );

    let books = response.data.docs;

    /* 📅 YEAR FILTER (single year – tolerant) */
    if (year) {
      const y = Number(year);
      books = books.filter(
        (book) =>
          book.first_publish_year &&
          Math.abs(book.first_publish_year - y) <= 1
      );
    }

    /* 📘 SUBJECT FILTER */
    if (subject) {
      books = books.filter((book) =>
        book.subject?.some((s) =>
          s.toLowerCase().includes(subject.toLowerCase())
        )
      );
    }

    /* 📖 AVAILABILITY FILTER */
    if (availability === "readable") {
      books = books.filter((book) => book.has_fulltext === true);
    }

    if (availability === "borrowable") {
      books = books.filter((book) => book.public_scan_b === true);
    }

    res.json({
      success: true,
      count: books.length,
      books,
    });
  } catch (error) {
    next(error);
  }
};

/* 💾 SAVE BOOK */
export const saveBook = async (req, res, next) => {
  try {
    const {
      key,
      title,
      author_name,
      first_publish_year,
      cover_i,
      subject,
      has_fulltext,
      public_scan_b,
      coverUrl,
    } = req.body;

    const book = await Book.create({
      openLibraryId: key,
      title,
      authors: author_name,
      firstPublishYear: first_publish_year,
      coverId: cover_i,
      coverUrl: coverUrl || null,
      subjects: subject,
      availability: {
        readable: has_fulltext,
        borrowable: public_scan_b,
      },
    });

    res.status(201).json({
      success: true,
      message: "Book saved successfully",
      book,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Book already saved",
      });
    }
    next(error);
  }
};

/* 📚 GET SAVED BOOKS */
export const getSavedBooks = async (req, res, next) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json({ success: true, books });
  } catch (error) {
    next(error);
  }
};
