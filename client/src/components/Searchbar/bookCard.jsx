import axios from "axios";
import { useState } from "react";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BookCard({ book, onBookAdded }) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAddShelf = async () => {
    const workspaceId = localStorage.getItem("lastWorkspaceId");
    if (!workspaceId) {
      alert("No workspace selected");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Use ISBN if available, otherwise use the Open Library key without slashes
      let bookId;
      if (book.isbn?.[0]) {
        bookId = book.isbn[0];
      } else if (book.key) {
        // Ensure key starts with / before replacing slashes
        const key = book.key.startsWith("/") ? book.key : `/${book.key}`;
        bookId = key.replace(/\//g, "-");
      } else {
        bookId = `book-${Date.now()}`;
      }

      // Determine cover URL - prioritize Google Books, then Open Library, then null
      let coverUrl = null;
      if (book.cover_url) {
        coverUrl = book.cover_url;
      } else if (book.cover_i) {
        coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;
      }

      await axios.post(
        `/api/workspaces/${workspaceId}/cards`,
        {
          columnId: "to-read",
          bookId: bookId,
          title: book.title || "Unknown",
          author: book.author_name?.join(", ") || "Unknown",
          cover: coverUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Book added!");
      if (onBookAdded) onBookAdded();
    } catch {
      alert("Failed to add book");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadBook = () => {
    let bookId;
    if (book.isbn?.[0]) {
      bookId = book.isbn[0];
    } else if (book.key) {
      // Ensure key starts with / before replacing slashes
      const key = book.key.startsWith("/") ? book.key : `/${book.key}`;
      bookId = key.replace(/\//g, "-");
    } else {
      bookId = `book-${Date.now()}`;
    }
    const encodedBookId = encodeURIComponent(bookId);
    navigate(`/reader/${encodedBookId}`, {
      state: {
        title: book.title,
        author: book.author_name?.join(", "),
      },
    });
  };

  return (
    <div className="bg-slate-800 text-white p-4 rounded-lg relative">
      {book.public_domain && (
        <div className="absolute top-2 right-2 bg-green-600 px-2 py-1 rounded text-xs font-bold">
          ✅ FREE
        </div>
      )}
      <h3 className="text-lg font-semibold">{book.title}</h3>
      <p className="text-sm text-gray-300">by {book.author_name?.join(", ") || "Unknown"}</p>
      <p className="text-xs text-gray-400">{book.first_publish_year || "N/A"}</p>

      {(book.cover_url || book.cover_i) && (
        <img
          className="mt-2 w-24 rounded"
          src={book.cover_url || `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
          alt={book.title}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleReadBook}
          title="Read book"
          className="flex-1 px-3 py-1 rounded text-sm bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-1"
        >
          <Eye size={16} />
          Read
        </button>
        <button
          onClick={handleAddShelf}
          disabled={isLoading}
          className={`flex-1 px-3 py-1 rounded text-sm ${
            isLoading ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700"
          } text-white`}
        >
          {isLoading ? "Adding..." : "Add to Workspace"}
        </button>
      </div>
    </div>
  );
}
