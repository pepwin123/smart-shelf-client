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
    const [totalResults, setTotalResults] = useState(0);
    const socketRef = useRef(null);
    const booksPerPage = 10;

    // Fetch random books on component mount
    useEffect(() => {
        const fetchRandomBooks = async () => {
            setLoading(true);
            try {
                const queries = ["fiction", "science", "history", "technology", "adventure"];
                const randomQuery = queries[Math.floor(Math.random() * queries.length)];
                
                const res = await axios.get("http://localhost:5000/api/search", {
                    params: { q: randomQuery, page: currentPage }
                });
                
                setBooks(res.data.books || []);
                setTotalResults(res.data.count || 0);
            } catch (error) {
                console.error("Failed to fetch random books:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRandomBooks();
    }, [currentPage]);

    // Initialize Socket.IO connection using a ref to avoid sync setState in effect
    useEffect(() => {
        const s = io("http://localhost:5000");
        socketRef.current = s;

        return () => {
            s.disconnect();
            socketRef.current = null;
        };
    }, []);

    // Handle when a book is added to workspace
    const handleBookAdded = (workspace) => {
        const s = socketRef.current;
        if (s && workspace) {
            const workspaceId = workspace._id;
            // Emit event so other users see real-time update
            s.emit("card-added", {
                workspaceId,
                workspace,
                message: `A book was added to "${workspace.name}"`,
            });
            console.log("✅ Book added event emitted to all users in workspace");
        }
    };

    const handleSearchResults = (results, total) => {
        setBooks(results);
        setTotalResults(total);
        setCurrentPage(1);
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
                        <button onClick={() => setShowAddModal(true)} className="w-full lg:w-auto bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Add Manual Book</button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8 scrollbar-hide">
                {loading && <p className="text-center text-gray-400 mb-8">Loading books...</p>}
                
                <div className="mb-8">
                    <SearchResults books={books} onBookAdded={handleBookAdded} />
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