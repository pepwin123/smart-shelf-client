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

  const performSearch = async (searchQuery, searchYear, searchSubject, searchAvailability) => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError("");

      const params = {
        q: searchQuery,
        ...(searchYear && { year: searchYear }),
        ...(searchSubject && { subject: searchSubject }),
        ...(searchAvailability && { availability: searchAvailability }),
      };

      const res = await axios.get("/api/search", { params });

      onResults(res.data.books, res.data.count);
    } catch {
      setError("Search failed. Please try again.");
      onResults([], 0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    performSearch(query, year, subject, availability);
  };

  const handleYearChange = (e) => {
    const newYear = e.target.value;
    setYear(newYear);
    // Trigger search with current query and new year filter
    performSearch(query, newYear, subject, availability);
  };

  const handleSubjectChange = (e) => {
    const newSubject = e.target.value;
    setSubject(newSubject);
    // Trigger search with current query and new subject filter
    performSearch(query, year, newSubject, availability);
  };

  const handleAvailabilityChange = (e) => {
    const newAvailability = e.target.value;
    setAvailability(newAvailability);
    // Trigger search with current query and new availability filter
    performSearch(query, year, subject, newAvailability);
  };

  const handleQueryChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    // Trigger search with new query and current filters
    if (newQuery.trim()) {
      performSearch(newQuery, year, subject, availability);
    }
  };

  const clearFilters = () => {
    setYear("");
    setSubject("");
    setAvailability("");
    // Search with cleared filters
    performSearch(query, "", "", "");
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto mb-8">
      {/* Search Input */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search books by title or author..."
            value={query}
            onChange={handleQueryChange}
            className="w-full p-3 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 disabled:opacity-50"
          >
            <Search size={20} />
          </button>
        </div>
      </div>

      {/* Basic Filters Row */}
      <div className="flex gap-2 flex-wrap mb-4">
        <input
          type="number"
          placeholder="Year"
          value={year}
          onChange={handleYearChange}
          className="p-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:outline-none w-24"
        />
        <input
          type="text"
          placeholder="Category"
          value={subject}
          onChange={handleSubjectChange}
          className="p-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:outline-none flex-1 min-w-40"
        />
        <select
          value={availability}
          onChange={handleAvailabilityChange}
          className="p-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:outline-none w-40"
        >
          <option value="">Availability</option>
          <option value="readable">Has Preview</option>
        </select>
        {(year || subject || availability) && (
          <button
            type="button"
            onClick={clearFilters}
            className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm"
          >
            Clear
          </button>
        )}
      </div>

      {/* Status Messages */}
      {loading && <p className="text-blue-400 text-sm">🔍 Searching...</p>}
      {error && <p className="text-red-400 text-sm">❌ {error}</p>}
    </form>
  );
}

