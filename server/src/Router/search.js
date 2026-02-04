import express from "express";
import axios from "axios";
import Book from "../models/bookModel.js";

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

    // Also search local saved/manual books and merge
    try {
      // Build a simple query: search q in title or authors or subjects
      const dbQuery = {
        $or: [
          { title: { $regex: q, $options: "i" } },
          { authors: { $elemMatch: { $regex: q, $options: "i" } } },
          { subjects: { $elemMatch: { $regex: q, $options: "i" } } },
        ],
      };

      if (year) {
        dbQuery.firstPublishYear = Number(year);
      }

      if (subject) {
        dbQuery.subjects = { $elemMatch: { $regex: subject, $options: "i" } };
      }

      if (availability === "readable") {
        dbQuery["availability.readable"] = true;
      }
      if (availability === "borrowable") {
        dbQuery["availability.borrowable"] = true;
      }

      const localBooks = await Book.find(dbQuery).limit(50).lean();

      // Map localBooks to same shape as OpenLibrary docs
      const mapped = localBooks.map((b) => ({
        key: b.openLibraryId, // manual-<ts> or real OL id
        title: b.title,
        author_name: b.authors || [],
        first_publish_year: b.firstPublishYear,
        cover_i: b.coverId || null,
        cover_url: b.coverUrl || null,
        subject: b.subjects || b.subject || [],
        // availability compatible fields
        has_fulltext: !!(b.availability && b.availability.readable),
        public_scan_b: !!(b.availability && b.availability.borrowable),
        _manual: true,
      }));

      // Append manual books after remote results
      books = [...mapped, ...books];
    } catch (err) {
      console.error("Error querying local books:", err);
    }

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
