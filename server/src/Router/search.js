import axios from "axios";

const searchBooks = async (req, res) => {
  try {
    const { q, page = 1 } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, message: "Query required" });
    }

    const response = await axios.get(
      "https://openlibrary.org/search.json",
      {
        params: {
          q,
          page,
          limit: 10,
          fields:
            "key,title,author_name,first_publish_year,cover_i,subject",
        },
      }
    );

    res.json({ success: true, books: response.data.docs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Search failed" });
  }
};

export default searchBooks;
