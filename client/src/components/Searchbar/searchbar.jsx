import { useState } from "react";
import axios from "axios";
import { Search } from "lucide-react";

export default function SearchBar({ onResults }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [year, setYear] = useState("");
  const [subject, setSubject] = useState("");
  const [availability, setAvailability] = useState("");
  const [publicDomainOnly, setPublicDomainOnly] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError("");

      // Use different endpoint based on search type
      const endpoint = publicDomainOnly 
        ? "http://localhost:5000/api/search/public-domain"
        : "http://localhost:5000/api/search";

      const res = await axios.get(endpoint, {
        params: { q: query, year, subject, availability },
      });

      onResults(res.data.books, res.data.count);
    } catch {
      setError("Search failed");
      onResults([], 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto mb-8">
      {/* Search Input */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search books..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-3 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
          >
            <Search size={20} />
          </button>
        </div>
      </div>

      {/* Simple Filters Row */}
      <div className="flex gap-2 flex-wrap mb-4 items-center">
        <button
          type="button"
          onClick={() => setPublicDomainOnly(!publicDomainOnly)}
          className={`px-3 py-2 rounded-lg font-medium transition ${
            publicDomainOnly
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-900 hover:bg-gray-300"
          }`}
          title="Search only copyright-free public domain books"
        >
          📖 {publicDomainOnly ? "Public Domain" : "All Books"}
        </button>
        
        {!publicDomainOnly && (
          <>
            <input
              type="number"
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="p-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:outline-none w-28"
            />
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="p-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:outline-none flex-1 min-w-40"
            />
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="p-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:outline-none w-40"
            >
              <option value="">Availability</option>
              <option value="readable">Readable</option>
              <option value="borrowable">Borrowable</option>
            </select>
          </>
        )}
      </div>

      {/* Status Messages */}
      {loading && <p className="text-blue-600 text-sm">Searching...</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  );
}

