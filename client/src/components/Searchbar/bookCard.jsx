import axios from "axios";
import { useState } from "react";

export default function BookCard({ book, onBookAdded }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddShelf = async () => {
    const workspaceId = localStorage.getItem("lastWorkspaceId");

    if (!workspaceId) {
      alert("No workspace selected");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Add book directly to workspace as a card in "to-read" column
      const res = await axios.post(
        `/api/workspaces/${workspaceId}/cards`,
        {
          columnId: "to-read",
          bookId: book.key || `book-${Date.now()}`,
          title: book.title || "Unknown Title",
          author: book.author_name?.join(", ") || "Unknown Author",
          cover: book.cover_i 
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` 
            : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Callback to parent (Home component) to refresh or parent handles emit
      if (onBookAdded) {
        onBookAdded(res.data.workspace);
      }

      alert("✅ Book added to Shelf! Other users will see it instantly.");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to add book");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 text-white p-4 rounded-lg relative top-50">
      <h3 className="text-lg font-semibold">{book.title}</h3>

      <p className="text-sm text-gray-300">
        Author: {book.author_name?.join(", ") || "Unknown"}
      </p>

      <p className="text-sm text-gray-400">
        First Published: {book.first_publish_year || "N/A"}
      </p>

      {book.cover_i && (
        <img
          className="mt-2 w-24 rounded"
          src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
          alt={book.title}
        />
      )}

      {/* ✅ ADD BUTTON */}
      <button
        onClick={handleAddShelf}
        disabled={isLoading}
        className={`mt-3 px-3 py-1 rounded text-sm ${
          isLoading ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isLoading ? "Adding..." : "Add to Workspace"}
      </button>
    </div>
  );
}
