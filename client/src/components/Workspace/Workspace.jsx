import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import WorkspaceBoard from "./WorkspaceBoard";
import Header from "../Navbar/navbar";
import { Search } from "lucide-react";
import { getCachedBook } from "../../api/shelfApi";

export default function Workspace({ setUser }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState("");
  const [socket, setSocket] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Function to fetch all workspaces
  const fetchWorkspaces = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/workspaces", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkspaces(res.data.workspaces);
      setIsLoading(false);

      if (res.data.workspaces.length > 0 && !selectedWorkspaceId) {
        setSelectedWorkspaceId(res.data.workspaces[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
      setIsLoading(false);
    }
  }, [selectedWorkspaceId]);

  // Function to create a new workspace
  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/workspaces",
        { name: newWorkspaceName, description: newWorkspaceDesc },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWorkspaces([...workspaces, res.data.workspace]);
      setSelectedWorkspaceId(res.data.workspace._id);
      setNewWorkspaceName("");
      setNewWorkspaceDesc("");
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create workspace:", error);
    }
  };

  // Function to add book to workspace
  const handleAddBookToShelf = async (book) => {
    if (!selectedWorkspaceId) {
      alert("Please select a workspace first");
      return;
    }

    const bookTitle = book.title || "Unknown Title";
    const bookAuthor = book.author_name
      ? book.author_name.join(", ")
      : "Unknown Author";

    try {
      // Fetch and cache book metadata from OpenLibrary
      const cachedBookRes = await getCachedBook(book.key);
      const cachedBook = cachedBookRes.data.book || {};

      const token = localStorage.getItem("token");
      const res = await axios.post(
        `/api/workspaces/${selectedWorkspaceId}/cards`,
        {
          columnId: "to-read",
          bookId: book.key || `book-${Date.now()}`,
          title: cachedBook.title || bookTitle,
          author: cachedBook.authors?.join(", ") || bookAuthor,
          cover: cachedBook.coverUrl || (book.cover_i
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`
            : null),
          metadata: cachedBook,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Notify via socket with enriched metadata
      if (socket) {
        socket.emit("card-added", {
          workspaceId: selectedWorkspaceId,
          workspace: res.data.workspace,
          bookMetadata: cachedBook,
        });
      }

      alert("Book added to To Read!");
    } catch (error) {
      console.error("Failed to add book:", error);
      alert("Failed to add book to shelf");
    }
  };

  // Function to search books
  const handleSearchBooks = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const res = await axios.get("/api/search", {
        params: { q: searchQuery },
      });
      setSearchResults(res.data.books || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Failed to search books:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  // Join/leave socket.io workspace room when selection changes
  useEffect(() => {
    if (!socket) return;
    let previous = null;
    // store previous id on the socket instance to track
    try {
      previous = socket.__currentWorkspaceId || null;
    } catch (e) {
      previous = null;
    }

    if (previous && previous !== selectedWorkspaceId) {
      socket.emit("leave-workspace", previous);
    }

    if (selectedWorkspaceId) {
      socket.emit("join-workspace", selectedWorkspaceId);
      socket.__currentWorkspaceId = selectedWorkspaceId;
    }

    return () => {
      if (socket && selectedWorkspaceId) {
        socket.emit("leave-workspace", selectedWorkspaceId);
        socket.__currentWorkspaceId = null;
      }
    };
  }, [socket, selectedWorkspaceId]);

  // Fetch all workspaces on mount
  useEffect(() => {
    fetchWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-xl text-white">Loading workspaces...</div>
        </div>
        <ActivityFeed socket={socket} workspaceId={selectedWorkspaceId} />
      </>
    );
  }

  return (
    <div>
      <Header setUser={setUser} />
      <div className="pt-20 min-h-screen bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Top Controls - Workspace Selection and Search Horizontally */}
          <div className="flex gap-4 mb-6">
            {/* Left Column - Workspace Selection and Create */}
            <div className="w-80 space-y-4">
              {/* Workspace Selection */}
              <div className="bg-gray-800 rounded-lg p-4">
                <label className="block text-white text-sm font-medium mb-2">
                  Select Workspace
                </label>
                <select
                  value={selectedWorkspaceId || ""}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 outline-none text-sm"
                >
                  <option value="">Choose a workspace...</option>
                  {workspaces.map((ws) => (
                    <option key={ws._id} value={ws._id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Create Workspace Section */}
              <div className="bg-gray-800 rounded-lg p-4">
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded font-medium text-sm transition"
                >
                  {showCreateForm ? "Cancel" : "+ New Workspace"}
                </button>

                {showCreateForm && (
                  <form onSubmit={handleCreateWorkspace} className="mt-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Workspace name"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      className="w-full p-2 bg-gray-700 text-white rounded text-sm border border-gray-600 focus:border-blue-500 outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newWorkspaceDesc}
                      onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                      className="w-full p-2 bg-gray-700 text-white rounded text-sm border border-gray-600 focus:border-blue-500 outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded font-medium text-sm transition"
                    >
                      Create
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Right Column - Search Books */}
            <div className="flex-1 bg-gray-800 rounded-lg p-4">
              <form onSubmit={handleSearchBooks} className="flex gap-1">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search books..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white px-4 py-2 rounded font-medium text-sm transition flex items-center gap-2"
                >
                  <Search size={16} />
                  {isSearching ? "..." : "Search"}
                </button>
              </form>
            </div>
          </div>

          {/* Search Results Section - Display if searching */}
          {showSearchResults && searchResults.length > 0 && selectedWorkspaceId && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold">Search Results</h3>
                <button
                  onClick={() => setShowSearchResults(false)}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {searchResults.map((book) => (
                  <div key={book.key} className="bg-gray-700 p-3 rounded hover:bg-gray-600 transition">
                    <p className="text-white font-medium text-sm truncate">{book.title}</p>
                    {book.author_name && (
                      <p className="text-gray-300 text-xs truncate">{book.author_name.join(", ")}</p>
                    )}
                    {book.first_publish_year && (
                      <p className="text-gray-400 text-xs">Published: {book.first_publish_year}</p>
                    )}
                    <button
                      onClick={() => handleAddBookToShelf(book)}
                      className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white p-2 rounded text-xs font-medium transition"
                    >
                      Add to Shelf
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Board Area */}
          <div>
            {selectedWorkspaceId ? (
              <WorkspaceBoard workspaceId={selectedWorkspaceId} socket={socket} />
            ) : (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <p className="text-gray-400">Select a workspace to begin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import ActivityFeed from "./ActivityFeed";
