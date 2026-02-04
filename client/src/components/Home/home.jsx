import Header from "../Navbar/navbar";
import SearchBar from "../Searchbar/searchbar";
import SearchResults from "../Searchbar/searchResults";
import AddManualBook from "../AddManualBook/AddManualBook";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

export default function Home({setUser}) {
    const [books, setBooks] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [socket, setSocket] = useState(null);

    // Initialize Socket.IO connection
    useEffect(() => {
        const newSocket = io("http://localhost:5000");
        setSocket(newSocket);
        
        return () => newSocket.disconnect();
    }, []);

    // Handle when a book is added to workspace
    const handleBookAdded = (workspace) => {
        if (socket && workspace) {
            const workspaceId = workspace._id;
            // Emit event so other users see real-time update
            socket.emit("card-added", {
                workspaceId,
                workspace,
                message: `A book was added to "${workspace.name}"`,
            });
            console.log("✅ Book added event emitted to all users in workspace");
        }
    };

    return (
        <div>
            <Header setUser={setUser} />
            <div className="min-h-screen bg-neutral-300 pt-24 px-8">
                <div className="flex items-center justify-between mb-6">
                    <SearchBar onResults={setBooks} />
                    <div className="ml-4">
                        <button onClick={() => setShowAddModal(true)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Add Manual Book</button>
                    </div>
                </div>

                <SearchResults books={books} onBookAdded={handleBookAdded} />

                <AddManualBook isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
            </div>
        </div>
    )
}