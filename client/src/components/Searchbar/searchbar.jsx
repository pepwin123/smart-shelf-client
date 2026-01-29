import { useState } from "react";
import axios from "axios";
import { AiOutlineSearch } from "react-icons/ai";

export default function SearchBar({ onResults }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!query.trim()) return;

    try {
      setLoading(true);
      setError("");

      const res = await axios.get(
        `http://localhost:5000/api/search?q=${query}`
      );

      onResults(res.data.books);
    } catch (err) {
      setError("Search failed", err);
      onResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="fixed w-112.5 top-30 left-10 ">
      <input
        type="search"
        placeholder="Search books..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-4 rounded-full bg-slate-800 text-white outline-none"
      />

      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-slate-900 rounded-full"
      >
        <AiOutlineSearch className="text-white" />
      </button>

      {loading && <p className="text-white mt-2">Loading...</p>}
      {error && <p className="text-red-400 mt-2">{error}</p>}
    </form>
  );
}
