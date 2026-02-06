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
      // Use Google Books volume ID (always available from API response)
      const bookId = book.id || book.key;

      await axios.post(
        `/api/workspaces/${workspaceId}/cards`,
        {
          columnId: "to-read",
          bookId: bookId,
          title: book.title || "Unknown",
          author: book.author_name?.join(", ") || "Unknown",
          cover: book.cover_url || null,
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
    // Use Google Books volume ID
    const bookId = book.id || book.key;
    const encodedBookId = encodeURIComponent(bookId);
    navigate(`/reader/${encodedBookId}`, {
      state: {
        title: book.title,
        author: book.author_name?.join(", "),
        previewLink: book.previewLink,
        cover_url: book.cover_url,
        description: book.description,
        pages: book.pages,
        isbns: book.isbns,
      },
    });
  };

  return (
    <div className="bg-slate-800 text-white rounded-lg relative flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex-1 p-3 sm:p-4">
        <h3 className="text-base sm:text-lg font-semibold line-clamp-2">{book.title}</h3>
        <p className="text-xs sm:text-sm text-gray-300 line-clamp-1">by {book.author_name?.join(", ") || "Unknown"}</p>
        <p className="text-xs text-gray-400">{book.first_publish_year || "N/A"}</p>

        {book.cover_url && (
          <img
            className="mt-2 sm:mt-3 w-20 sm:w-24 rounded object-cover"
            src={book.cover_url}
            alt={book.title}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        )}
      </div>

      <div className="flex gap-1 sm:gap-2 p-2 sm:p-3 pt-2 sm:pt-3 border-t border-slate-700">
        <button
          onClick={handleReadBook}
          title="Read book"
          className="flex-1 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-1 transition-colors"
        >
          <Eye size={14} className="sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Read</span>
          <span className="sm:hidden">📖</span>
        </button>
        <button
          onClick={handleAddShelf}
          disabled={isLoading}
          className={`flex-1 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-colors ${
            isLoading ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700"
          } text-white`}
        >
          <span className="hidden sm:inline">{isLoading ? "Adding..." : "Add to Workspace"}</span>
          <span className="sm:hidden">{isLoading ? "..." : "+"}</span>
        </button>
      </div>
    </div>
  );
}
