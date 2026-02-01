import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const {
      q,
      page = 1,
      subject,
      year,        // ✅ single year
      yearFrom,
      yearTo,
      availability
    } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Query required"
      });
    }

    const response = await axios.get(
      "https://openlibrary.org/search.json",
      {
        params: {
          q,
          page,
          limit: 20,
          fields:
            "key,title,author_name,first_publish_year,cover_i,subject,has_fulltext,public_scan_b"
        }
      }
    );

    let books = response.data.docs;

    /* 📅 YEAR FILTER */
    books = books.filter(book => {
      if (!book.first_publish_year) return false;

      // ✅ SINGLE YEAR (your requirement)
      if (year && book.first_publish_year !== Number(year)) {
        return false;
      }

      // (optional) RANGE support if you ever use it later
      if (yearFrom && book.first_publish_year < Number(yearFrom)) return false;
      if (yearTo && book.first_publish_year > Number(yearTo)) return false;

      return true;
    });

    /* 📘 SUBJECT FILTER */
    if (subject) {
      books = books.filter(book =>
        book.subject?.some(s =>
          s.toLowerCase().includes(subject.toLowerCase())
        )
      );
    }

    /* 📖 AVAILABILITY FILTER */
    if (availability === "readable") {
      books = books.filter(book => book.has_fulltext === true);
    }

    if (availability === "borrowable") {
      books = books.filter(book => book.public_scan_b === true);
    }

    res.json({
      success: true,
      count: books.length,
      books
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Search failed"
    });
  }
});

export default router;
