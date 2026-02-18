import Header from "../Navbar/navbar";
import SearchBar from "../Searchbar/searchbar";
import SearchResults from "../Searchbar/searchResults";
import AddManualBook from "../AddManualBook/AddManualBook";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Home({setUser}) {
    const [books, setBooks] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentQuery, setCurrentQuery] = useState(null);
    const [currentYear, setCurrentYear] = useState(null);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [currentAvailability, setCurrentAvailability] = useState(null);
    const [totalResults, setTotalResults] = useState(0);
    const socketRef = useRef(null);
    const abortRef = useRef(null);
    const cacheRef = useRef(new Map());
    const booksPerPage = 10;

    // Helper: fetch books for a query + page with cancellation and caching
    const fetchBooks = async (query, page = 1, year = null, category = null, availability = null) => {
        // Allow search with just filters (no query required)
        if (!query && !year && !category && !availability) return;

        const cacheKey = `${query}:${page}:${year}:${category}:${availability}`;
        if (cacheRef.current.has(cacheKey)) {
            const cached = cacheRef.current.get(cacheKey);
            setBooks(cached.books);
            setTotalResults(cached.count);
            return;
        }

        // cancel previous
        try {
            abortRef.current?.abort();
        } catch (e) { console.warn("Abort error (likely from already completed request):", e);}

        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        console.log(`🏠 Home: fetching for "${query || '(no query)'}" with filters - year: ${year}, category: ${category}, availability: ${availability}`);
        try {
            const params = { page };
            if (query) params.q = query;
            if (year) params.year = year;
            if (category) params.category = category;
            if (availability) params.availability = availability;
            const res = await axios.get("/api/search", {
                params,
                signal: controller.signal,
            });

            console.log(`📚 Home received: ${res.data.books?.length || 0} books`);
            setBooks(res.data.books || []);
            setTotalResults(res.data.count || 0);

            cacheRef.current.set(cacheKey, { books: res.data.books || [], count: res.data.count || 0 });
        } catch (error) {
            // ignore cancellations
            if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError' || error?.message === 'canceled') return;
            console.error("❌ Home fetch error:", error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    // Trigger fetch when query, page, or filters change
    useEffect(() => {
        if (!currentQuery) return;
        fetchBooks(currentQuery, currentPage, currentYear, currentCategory, currentAvailability);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentQuery, currentPage, currentYear, currentCategory, currentAvailability]);

    // On mount pick an initial random query
    useEffect(() => {
        const queries = ["fiction", "science", "history", "technology", "adventure"];
        const randomQuery = queries[Math.floor(Math.random() * queries.length)];
        setCurrentQuery(randomQuery);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Initialize Socket.IO connection using a ref to avoid sync setState in effect
    useEffect(() => {
        const s = io("http://localhost:5000");
        socketRef.current = s;

        return () => {
            s.disconnect();
            socketRef.current = null;
        };
    }, []);

    const handleSearchResults = (results, total, year = null, category = null, availability = null) => {
        setBooks(results);
        setTotalResults(total);
        setCurrentPage(1);
        setCurrentYear(year);
        setCurrentCategory(category);
        setCurrentAvailability(availability);
    };

    const totalPages = Math.ceil(totalResults / booksPerPage);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    return (
        <div className="flex flex-col h-screen bg-gray-900">
            <Header setUser={setUser} />
            
            {/* Fixed Search Bar */}
            <div className="bg-gray-900 pt-22 pb-4 px-8 border-b border-gray-700 shrink-0">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    <div className="flex-1">
                        <SearchBar onResults={handleSearchResults} />
                    </div>
                    <div className="w-full lg:w-auto">
                                                <div className="flex gap-2">
                                                    <button onClick={() => setShowAddModal(true)} className="w-full lg:w-auto bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Add Manual Book</button>
                                                    <button onClick={() => {
                                                        const queries = ["fiction","science","history","technology","adventure"];
                                                        // Prefer a different topic than the current one
                                                        let q = currentQuery;
                                                        let attempts = 0;
                                                        while ((q === currentQuery) && attempts < 6) {
                                                            q = queries[Math.floor(Math.random() * queries.length)];
                                                            attempts += 1;
                                                        }
                                                        // Reset to page 1 and set the new query
                                                        setCurrentPage(1);
                                                        // Force a state change even if q equals currentQuery by clearing then setting
                                                        if (q === currentQuery) {
                                                            setCurrentQuery(null);
                                                            // small delay to ensure effect sees a change
                                                            setTimeout(() => setCurrentQuery(q), 0);
                                                        } else {
                                                            setCurrentQuery(q);
                                                        }
                                                    }} className="w-full lg:w-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Random</button>
                                                </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8 scrollbar-hide">
                {loading && <p className="text-center text-gray-400 mb-8">Loading books...</p>}
                
                <div className="mb-8">
                    <SearchResults books={books} />
                </div>

                {/* Pagination Controls */}
                {totalResults > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-16 mb-16 p-6 bg-gray-800 rounded-lg border border-gray-700 shadow-md">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={!hasPrevPage}
                            className="p-2 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            title="Previous page"
                        >
                            <ChevronLeft size={24} className="text-gray-300" />
                        </button>

                        <div className="flex items-center gap-2">
                            <span className="text-gray-300 font-semibold">Page</span>
                            <input
                                type="number"
                                min="1"
                                max={totalPages}
                                value={currentPage}
                                onChange={(e) => {
                                    const page = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1));
                                    setCurrentPage(page);
                                }}
                                className="w-14 p-2 border border-gray-600 rounded text-center bg-gray-700 text-white"
                            />
                            <span className="text-gray-300 font-semibold">of {totalPages}</span>
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={!hasNextPage}
                            className="p-2 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            title="Next page"
                        >
                            <ChevronRight size={24} className="text-gray-300" />
                        </button>

                        <span className="text-gray-400 text-sm sm:ml-8">
                            Total: {totalResults} results
                        </span>
                    </div>
                )}

                <AddManualBook isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
            </div>
        </div>
    )
}