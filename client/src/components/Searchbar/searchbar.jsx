import { useState } from "react";
import axios from "axios";
import { Search } from "lucide-react";

export default function SearchBar({ onResults }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [year, setYear] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState("");

  const performSearch = async (searchQuery, searchYear, searchCategory, searchAvailability) => {
    try {
      setLoading(true);
      setError("");

      // Build query - allow empty query if filters are present
      const params = {};
      
      if (searchQuery?.trim()) {
        params.q = searchQuery;
      }
      if (searchYear) {
        params.year = searchYear;
      }
      if (searchCategory) {
        params.category = searchCategory;
      }
      if (searchAvailability) {
        params.availability = searchAvailability;
      }

      // Require at least a query or filters
      if (Object.keys(params).length === 0) {
        onResults([], 0);
        return;
      }

      const res = await axios.get("/api/search", { params });
      onResults(res.data.books || [], res.data.count || 0, searchYear, searchCategory, searchAvailability);
    } catch (err) {
      setError("Search failed. Please try again.");
      onResults([], 0, searchYear, searchCategory, searchAvailability);
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    performSearch(query, year, category, availability);
  };

  const handleYearChange = (e) => {
    const newYear = e.target.value;
    setYear(newYear);
    // Only trigger search if year is empty or a valid 4-digit year
    if (!newYear || (newYear.length === 4 && !isNaN(newYear))) {
      performSearch(query, newYear, category, availability);
    }
  };

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setCategory(newCategory);
    // Trigger search with current query and new category filter
    // Use the new category value directly since state hasn't updated yet
    performSearch(query || "", year, newCategory, availability);
  };

  const handleAvailabilityChange = (e) => {
    const newAvailability = e.target.value;
    setAvailability(newAvailability);
    // Trigger search with current query and new availability filter
    performSearch(query, year, category, newAvailability);
  };

  const handleQueryChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    // Trigger search with new query and current filters
    if (newQuery.trim()) {
      performSearch(newQuery, year, category, availability);
    }
  };

  const clearFilters = () => {
    setYear("");
    setCategory("");
    setAvailability("");
    setQuery("");
    onResults([], 0);
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
        <select
          value={category}
          onChange={handleCategoryChange}
          className="p-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:outline-none flex-1 min-w-40"
        >
          <option value="">Select Category</option>
          <option value="fiction">Fiction</option>
          <option value="mystery">Mystery</option>
          <option value="science fiction">Science Fiction</option>
          <option value="fantasy">Fantasy</option>
          <option value="romance">Romance</option>
          <option value="thriller">Thriller</option>
          <option value="biography">Biography</option>
          <option value="history">History</option>
          <option value="science">Science</option>
          <option value="technology">Technology</option>
          <option value="business">Business</option>
          <option value="self-help">Self-Help</option>
          <option value="poetry">Poetry</option>
          <option value="drama">Drama</option>
          <option value="adventure">Adventure</option>
          <option value="horror">Horror</option>
          <option value="education">Education</option>
          <option value="philosophy">Philosophy</option>
          <option value="art">Art</option>
          <option value="cooking">Cooking</option>
          <option value="travel">Travel</option>
          <option value="sports">Sports</option>
          <option value="psychology">Psychology</option>
        </select>
        <select
          value={availability}
          onChange={handleAvailabilityChange}
          className="p-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:outline-none w-40"
        >
          <option value="">Availability</option>
          <option value="readable">Has Preview</option>
        </select>
        {(year || category || availability) && (
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

