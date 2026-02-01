import { useState } from "react";
import axios from "axios";
import { AiOutlineSearch } from "react-icons/ai";

export default function SearchBar({ onResults }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [year, setYear] = useState("");
  const [subject, setSubject] = useState("");
  const [availability, setAvailability] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError("");

      const res = await axios.get("http://localhost:5000/api/search", {
        params: { q: query, year, subject, availability },
      });

      onResults(res.data.books);
    } catch {
      setError("Search failed");
      onResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="fixed top-30 left-60 flex flex-row items-center gap-3 flex-nowrap"
    >
      {/* Search box */}
      <div className="relative w-80 flex">
        <input
          type="text"
          placeholder="Search books..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-3 pr-12 rounded bg-slate-800 text-white outline-none"
        />

        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-slate-900 rounded-full"
        >
          <AiOutlineSearch className="text-white" />
        </button>
      </div>

      {/* Year */}
      <input
        type="number"
        placeholder="Year"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="p-2 rounded bg-slate-800 text-white outline-none w-24"
      />

      {/* Subject */}
      <input
        type="text"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="p-2 rounded bg-slate-800 text-white outline-none w-32"
      />

      {/* Availability */}
      <select
        value={availability}
        onChange={(e) => setAvailability(e.target.value)}
        className="p-2 rounded bg-slate-800 text-white outline-none w-32"
      >
        <option value="">Availability</option>
        <option value="readable">Readable</option>
        <option value="borrowable">Borrowable</option>
      </select>

      {loading && <p className="text-white">Loading...</p>}
      {error && <p className="text-red-400">{error}</p>}
    </form>
  );
}
