import axios from "axios";
import Book from "../Models/bookModel.js";

export const searchBooks = async (req, res, next) => {
  try {
    const { q, page = 1, subject, year, availability } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const startIndex = (page - 1) * 50;
    const response = await axios.get(
      "https://www.googleapis.com/books/v1/volumes",
      {
        params: {
          q,
          startIndex,
          maxResults: 50,
          orderBy: "relevance",
        },
      }
    );

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
    })) || [];

    // Google Books API already returns results ranked by relevance
    // Filter to only books that have titles and useful data
    books = books.filter((book) => {
      return book.title && (book.cover_url || book.has_fulltext);
    });

    // Limit to top 10 results
    books = books.slice(0, 10);

    /* 📅 YEAR FILTER */
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
      id,
      key,
      title,
      author_name,
      first_publish_year,
      cover_url,
      subject,
      has_fulltext,
      description,
      pages,
      contentUrl,
    } = req.body;

    const book = await Book.create({
      googleBooksId: id || key,
      title,
      authors: author_name,
      firstPublishYear: first_publish_year,
      coverUrl: cover_url || null,
      contentUrl: contentUrl || null,
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

/* 📚 GET SAVED BOOKS */
export const getSavedBooks = async (req, res, next) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json({ success: true, books });
  } catch (error) {
    next(error);
  }
};

/* 📖 GET BOOK WORK METADATA */
export const getWorkMetadata = async (req, res, next) => {
  try {
    const { workId } = req.params;
    
    // Fetch book details from Google Books API
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes/${workId}`
    );
    
    const volumeInfo = response.data.volumeInfo;
    if (!volumeInfo) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({
      title: volumeInfo.title || "Unknown",
      author: volumeInfo.authors?.[0] || "Unknown",
      description: volumeInfo.description || "No description available",
      number_of_pages: volumeInfo.pageCount || 0,
      cover_url: volumeInfo.imageLinks?.medium || volumeInfo.imageLinks?.thumbnail || null,
      readable_url: response.data.selfLink || null,
      has_readable_version: !!volumeInfo.previewLink,
      isbns: volumeInfo.industryIdentifiers?.map(id => id.identifier) || [],
      publisher: volumeInfo.publisher || "Unknown",
      publishedDate: volumeInfo.publishedDate || null,
      language: volumeInfo.language || "en",
      categories: volumeInfo.categories || [],
      previewLink: volumeInfo.previewLink || null,
    });
  } catch (error) {
    next(error);
  }
};


/* 📕 GET BOOK EDITION METADATA */
export const getEditionMetadata = async (req, res, next) => {
  try {
    const { bookKey } = req.params;
    const response = await axios.get(
      `https://openlibrary.org/books/${bookKey}.json`
    );
    
    const data = response.data;
    
    // Handle description - can be string or object with value property
    let description = "";
    if (typeof data.description === "string") {
      description = data.description;
    } else if (data.description?.value) {
      description = data.description.value;
    }

    // Extract ISBN, LCCN, OCLC
    let isbn = null;
    let lccn = null;
    let oclc = null;
    
    if (data.isbn_10?.[0]) {
      isbn = data.isbn_10[0];
    } else if (data.isbn_13?.[0]) {
      isbn = data.isbn_13[0];
    }
    
    if (data.lccn?.[0]) {
      lccn = data.lccn[0];
    }
    
    if (data.oclc?.[0]) {
      oclc = data.oclc[0];
    }

    res.json({
      title: data.title,
      author: data.authors?.[0]?.name,
      description: description || "No description available",
      number_of_pages: data.number_of_pages,
      cover_url: data.covers?.[0] ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-M.jpg` : null,
      isbns: isbn ? [isbn] : [],
      lccn: lccn,
      oclc: oclc,
    });
  } catch (error) {
    console.error("Error fetching edition metadata:", error.message);
    next(error);
  }
};

/* 📌 GET BOOK METADATA BY ISBN */
export const getISBNMetadata = async (req, res, next) => {
  try {
    const { isbn } = req.params;
    const response = await axios.get(
      "https://www.googleapis.com/books/v1/volumes",
      {
        params: {
          q: `isbn:${isbn}`,
          maxResults: 1,
        },
      }
    );
    
    const item = response.data.items?.[0];
    if (!item) {
      return res.status(404).json({ message: "ISBN not found" });
    }

    const volumeInfo = item.volumeInfo;

    res.json({
      title: volumeInfo.title,
      author: volumeInfo.authors?.[0],
      description: volumeInfo.description || "No description available",
      number_of_pages: volumeInfo.pageCount || 0,
      cover_url: volumeInfo.imageLinks?.medium || volumeInfo.imageLinks?.thumbnail || null,
      isbns: [isbn],
      publisher: volumeInfo.publisher,
      publishedDate: volumeInfo.publishedDate,
    });
  } catch (error) {
    console.error("Error fetching ISBN metadata:", error.message);
    next(error);
  }
};

/* 📖 GET READABLE LINKS FROM OPEN LIBRARY READ API */
export const getReadableLinks = async (req, res, next) => {
  try {
    const { isbn, lccn, oclc, olid } = req.query;

    // Build the request based on provided identifier
    let url;
    let idType;
    let idValue;

    if (isbn) {
      idType = "isbn";
      idValue = isbn;
    } else if (lccn) {
      idType = "lccn";
      idValue = lccn;
    } else if (oclc) {
      idType = "oclc";
      idValue = oclc;
    } else if (olid) {
      idType = "olid";
      idValue = olid;
    } else {
      return res.status(400).json({
        success: false,
        message: "At least one identifier (isbn, lccn, oclc, olid) is required",
      });
    }

    url = `https://openlibrary.org/api/volumes/brief/${idType}/${idValue}.json`;

    console.log(`📖 Fetching Read API for ${idType}:${idValue} from ${url}`);

    const response = await axios.get(url);
    const data = response.data;

    // Extract the most useful info from the Read API response
    const items = data.items || [];
    const records = data.records || {};

    // Sort items: prefer 'exact' matches and 'full access' status
    items.sort((a, b) => {
      const matchScore = (a.match === "exact" ? 1 : 0) - (b.match === "exact" ? 1 : 0);
      if (matchScore !== 0) return -matchScore; // higher first

      const statusOrder = { "full access": 3, "lendable": 2, "checked out": 1, "restricted": 0 };
      const aStatus = statusOrder[a.status] || 0;
      const bStatus = statusOrder[b.status] || 0;
      return bStatus - aStatus;
    });

    // Return the best match with a clean response
    const bestItem = items?.[0];
    const allItems = items;

    res.json({
      success: true,
      bestMatch: {
        title: "Book found",
        authors: [],
        previewLink: null,
        hasPreview: false,
      },
      allMatches: [],
      note: "Use Google Books API for book previews",
    });
  } catch (error) {
    console.error("Error fetching readable links:", error.message);
    // Return gracefully if no match found
    res.json({
      success: false,
      bestMatch: null,
      allMatches: [],
      note: "Could not fetch readable links from Google Books",
    });
  }
};

/* 📤 UPLOAD BOOK FILE (PDF) */
export const uploadBookFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // The server serves uploaded files from /uploads
    const filename = req.file.filename;
    const serverUrl = process.env.SERVER_URL || "";
    const fileUrl = `${serverUrl}/uploads/${filename}`;

    res.json({ success: true, url: fileUrl, filename });
  } catch (error) {
    next(error);
  }
};

/* 📸 UPLOAD COVER IMAGE */
export const uploadCoverImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // The server serves uploaded files from /uploads
    const filename = req.file.filename;
    const serverUrl = process.env.SERVER_URL || "";
    const fileUrl = `${serverUrl}/uploads/${filename}`;

    res.json({ success: true, url: fileUrl, filename });
  } catch (error) {
    next(error);
  }
};

