import axios from "axios";
import Book from "../Models/bookModel.js";

export const searchBooks = async (req, res, next) => {
  try {
    const { q, page = 1, perPage = 10, subject, year, availability } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const perPageInt = Math.min(Math.max(parseInt(perPage, 10) || 10, 1), 40);
    const pageInt = Math.max(parseInt(page, 10) || 1, 1);
    const startIndex = (pageInt - 1) * perPageInt;
    const response = await axios.get("https://www.googleapis.com/books/v1/volumes", {
      params: {
        q,
        startIndex,
        maxResults: perPageInt,
        orderBy: "relevance",
      },
    });

    let books = (response.data.items || []).map((item) => ({
      key: item.id,
      id: item.id,
      title: item.volumeInfo.title,
      author_name: item.volumeInfo.authors || [],
      first_publish_year: item.volumeInfo.publishedDate ? new Date(item.volumeInfo.publishedDate).getFullYear() : null,
      cover_url: item.volumeInfo.imageLinks?.medium || item.volumeInfo.imageLinks?.thumbnail || null,
      subject: item.volumeInfo.categories || [],
      has_fulltext: !!item.volumeInfo.previewLink,
      description: item.volumeInfo.description || "",
      pages: item.volumeInfo.pageCount || 0,
    }));

    // 📅 YEAR FILTER (single year)
    if (year) {
      books = books.filter(
        (book) => book.first_publish_year === Number(year)
      );
    }

    // 📘 SUBJECT FILTER
    if (subject) {
      books = books.filter((book) =>
        book.subject?.some((s) =>
          s.toLowerCase().includes(subject.toLowerCase())
        )
      );
    }

    // 📖 AVAILABILITY FILTER
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

export const saveBook = async (req, res, next) => {
  try {
    const {
      key,
      id,
      title,
      author_name,
      first_publish_year,
      cover_url,
      subject,
      has_fulltext,
      description,
      pages,
    } = req.body;

    const book = await Book.create({
      googleBooksId: id,
      title,
      authors: author_name,
      firstPublishYear: first_publish_year,
      coverUrl: cover_url,
      subjects: subject,
      availability: {
        readable: has_fulltext,
      },
      description: description || "",
      pages: pages || 0,
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

export const getSavedBooks = async (req, res, next) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json({ success: true, books });
  } catch (error) {
    next(error);
  }
};
