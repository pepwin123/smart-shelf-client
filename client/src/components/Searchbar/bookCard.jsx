import { addBook, getCachedBook } from "../../api/shelfApi";
import { useState } from "react";

export default function BookCard({ book }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddShelf = async () => {
    const workspaceId = localStorage.getItem("lastWorkspaceId");

    if (!workspaceId) {
      alert("No workspace selected");
      return;
    }

    setIsLoading(true);
    try {
      // Fetch and cache book metadata from OpenLibrary
      const cachedBook = await getCachedBook(book.key);

      // Extract relevant metadata
      const metadata = cachedBook.data.book || {};

      await addBook({
        workspaceId,
        bookId: book._id,
        title: metadata.title || book.title,
        author: metadata.authors?.join(", ") || book.author_name?.join(", ") || "Unknown",
        cover: metadata.coverUrl || (book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null),
        metadata,
      });

      alert("Book added to Shelf!");
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
        {isLoading ? "Adding..." : "Add to Shelf"}
      </button>
    </div>
  );
}
