import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, BookOpen, Loader } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import NotesSidebar from "./NotesSidebar";

export default function Reader() {
  const { bookId: encodedBookId } = useParams();
  const bookId = decodeURIComponent(encodedBookId || "");
  const navigate = useNavigate();
  const location = useLocation();

  const [viewer, setViewer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotesSidebar, setShowNotesSidebar] = useState(false);
  const [notes, setNotes] = useState([]);
  const [bookInfo, setBookInfo] = useState(null);
  
  const bookTitle = location.state?.title || "Book";
  const bookAuthor = location.state?.author || "Author";

  // Fetch book info from Google Books API
  useEffect(() => {
    const fetchBookInfo = async () => {
      try {
        const query = encodeURIComponent(`${bookTitle} ${bookAuthor}`);
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`
        );
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          const book = data.items[0].volumeInfo;
          setBookInfo({
            title: book.title || bookTitle,
            author: book.authors?.[0] || bookAuthor,
            description: book.description || "No description available",
            pages: book.pageCount || 0,
            cover: book.imageLinks?.medium || book.imageLinks?.thumbnail || null,
          });
        } else {
          setBookInfo({
            title: bookTitle,
            author: bookAuthor,
            description: "No description available",
            pages: 0,
            cover: null,
          });
        }
      } catch {
        console.log("Could not fetch book info from Google Books API");
        setBookInfo({
          title: bookTitle,
          author: bookAuthor,
          description: "No description available",
          pages: 0,
          cover: null,
        });
      }
    };

    if (bookTitle) {
      fetchBookInfo();
    }
  }, [bookTitle, bookAuthor]);

  // Initialize Google Books Viewer
  useEffect(() => {
    const initializeViewer = () => {
      const script = document.createElement("script");
      script.src = "https://www.google.com/books/jsapi.js";
      script.async = true;
      
      script.onload = () => {
        window.google.books.load();
        window.google.books.setOnLoadCallback(() => {
          try {
            const viewerContainer = document.getElementById("viewerCanvas");
            if (!viewerContainer) {
              console.log("Viewer container not ready");
              setIsLoading(false);
              return;
            }

            const viewerInstance = new window.google.books.DefaultViewer(viewerContainer);
            
            // Build array of identifiers to try (Google Books API supports multiple formats)
            // Try different identifier formats in order of likelihood
            const identifiers = [];
            
            // If bookId looks like a Google Books volume ID (alphanumeric with letters and numbers)
            if (bookId && /^[a-zA-Z0-9]{12}$/.test(bookId)) {
              identifiers.push(bookId); // Direct Google Books ID
            }
            
            // If bookId looks like an ISBN (all digits, 10 or 13 chars)
            if (bookId && /^\d{10,13}$/.test(bookId)) {
              identifiers.push(`ISBN:${bookId}`);
            }
            
            // If bookId contains slashes (Open Library format), convert it
            if (bookId && bookId.includes("/")) {
              // Try as direct ID first
              identifiers.push(bookId);
            }
            
            // If we haven't added anything yet, use bookId as-is
            if (identifiers.length === 0) {
              identifiers.push(bookId);
            }
            
            console.log("📚 Attempting to load book with identifiers:", identifiers);
            
            const onNotFound = () => {
              console.log("❌ Book preview not available in Google Books");
              console.log("   Tried identifiers:", identifiers);
              setViewer(null);
              setIsLoading(false);
            };
            
            const onSuccess = () => {
              console.log("✅ Google Books viewer loaded successfully");
              setViewer(viewerInstance);
              setIsLoading(false);
            };
            
            // Pass array of identifiers - viewer will try each one
            viewerInstance.load(identifiers, onNotFound, onSuccess);
          } catch (error) {
            console.error("Google Books initialization error:", error);
            setViewer(null);
            setIsLoading(false);
          }
        });
      };
      
      script.onerror = () => {
        console.error("Failed to load Google Books API");
        setViewer(null);
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
      return script;
    };

    if (bookId) {
      const script = initializeViewer();
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, [bookId]);

  // Fetch research notes for this book
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const token = localStorage.getItem("token");
        const encodedBookId = encodeURIComponent(bookId);
        const res = await fetch(`/api/notes/book/${encodedBookId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setNotes(data.notes || []);
      } catch (error) {
        console.error("Failed to fetch notes:", error);
      }
    };

    if (bookId) {
      fetchNotes();
    }
  }, [bookId]);

  const handleNextPage = () => {
    if (viewer && viewer.nextPage) {
      viewer.nextPage();
    }
  };

  const handlePreviousPage = () => {
    if (viewer && viewer.prevPage) {
      viewer.prevPage();
    }
  };

  const handleNoteAdded = (newNote) => {
    setNotes([newNote, ...notes]);
  };

  if (isLoading && !bookInfo) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Loader className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Main Reader Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-700 rounded transition"
              title="Go back"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{bookInfo?.title}</h1>
              <p className="text-sm text-gray-400">{bookInfo?.author}</p>
            </div>
          </div>

          <button
            onClick={() => setShowNotesSidebar(!showNotesSidebar)}
            className={`px-4 py-2 rounded flex items-center gap-2 transition ${
              showNotesSidebar
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
          >
            <BookOpen size={18} />
            Notes ({notes.length})
          </button>
        </div>

        {/* Reader Content */}
        <div className="flex-1 overflow-hidden p-4 bg-gray-900">
          {/* Google Books Viewer Container */}
          {viewer && (
            <div
              id="viewerCanvas"
              style={{
                width: "100%",
                height: "100%",
                minHeight: "500px",
              }}
            ></div>
          )}

          {/* Fallback Content if viewer not available */}
          {!viewer && bookInfo && (
            <div className="max-w-6xl mx-auto h-full overflow-auto">
              <div className="bg-linear-to-b from-gray-800 to-gray-900 rounded-lg p-8 text-white min-h-full flex flex-col items-center justify-center">
                <div className="flex flex-col md:flex-row gap-12 items-start md:items-center max-w-2xl">
                  {/* Cover Image */}
                  <div className="shrink-0">
                    {bookInfo?.cover ? (
                      <img 
                        src={bookInfo.cover} 
                        alt={bookInfo?.title}
                        className="rounded-lg shadow-2xl h-96 w-auto object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="bg-linear-to-br from-blue-500 to-purple-600 rounded-lg shadow-2xl h-96 w-64 flex items-center justify-center">
                        <BookOpen size={96} className="text-white opacity-50" />
                      </div>
                    )}
                  </div>

                  {/* Book Info */}
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold mb-2 text-white">
                      {bookInfo?.title}
                    </h1>
                    <p className="text-xl text-blue-400 mb-6">
                      by {bookInfo?.author}
                    </p>

                    {bookInfo?.pages > 0 && (
                      <p className="text-gray-300 mb-4">
                        <span className="font-semibold">Pages:</span> {bookInfo.pages}
                      </p>
                    )}

                    {bookInfo?.description && bookInfo.description !== "No description available" && (
                      <div className="mb-6">
                        <h3 className="font-bold text-lg text-white mb-3">About this book</h3>
                        <p className="text-gray-300 leading-relaxed max-h-48 overflow-y-auto">
                          {typeof bookInfo.description === 'string' 
                            ? bookInfo.description 
                            : bookInfo.description?.value || "No description available"}
                        </p>
                      </div>
                    )}

                    <div className="bg-blue-900 bg-opacity-50 border border-blue-500 rounded-lg p-4 mt-6 space-y-3">
                      <p className="text-sm text-gray-200 font-semibold">
                        📖 Preview not available through Google Books
                      </p>
                      
                      <div className="text-xs text-gray-300 bg-gray-800 bg-opacity-50 p-3 rounded border border-gray-700">
                        <p className="font-semibold mb-1">💡 Add Research Notes</p>
                        <p>Click the Notes button to add your own annotations and research notes for this book.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="bg-gray-800 border-t border-gray-700 p-4 flex items-center justify-between">
          <button
            onClick={handlePreviousPage}
            disabled={!viewer}
            className="p-2 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
            title="Previous page"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>

          <div className="flex items-center gap-4">
            <span className="text-white font-medium">
              {viewer ? "Use viewer controls" : "No preview available"}
            </span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={!viewer}
            className="p-2 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
            title="Next page"
          >
            <ChevronRight size={24} className="text-white" />
          </button>
        </div>
      </div>

      {/* Notes Sidebar */}
      {showNotesSidebar && (
        <NotesSidebar
          bookId={bookId}
          notes={notes}
          onNoteAdded={handleNoteAdded}
        />
      )}
    </div>
  );
}
