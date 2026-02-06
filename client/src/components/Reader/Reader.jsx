import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  const [showNotesSidebar, setShowNotesSidebar] = useState(true);
  const [notes, setNotes] = useState([]);
  const [bookInfo, setBookInfo] = useState(null);
  const [volumeAccess, setVolumeAccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const bookTitle = location.state?.title || "Book";
  const bookAuthor = location.state?.author || "Author";
  const locationISBNs = useMemo(() => location.state?.isbns || [], [location.state?.isbns]);
  const locationPreviewLink = location.state?.previewLink;

  // Refs to manage viewer lifecycle without forcing re-renders
  const viewerRef = useRef(null);
  const viewerContainerRef = useRef(null);

  // Viewer initialization function (defined early so it can be called from useEffect)
  const initializeViewerInstance = useCallback(() => {
    try {
      const viewerContainer = viewerContainerRef.current;
      if (!viewerContainer) {
        console.log("Viewer container not ready");
        setIsLoading(false);
        return;
      }

      // Check if embedding is allowed per Google Books accessInfo
      if (volumeAccess && volumeAccess.embeddable === false) {
        console.log("⚠️  Google Books reports this volume is not embeddable");
        setViewer(null);
        setIsLoading(false);
        return;
      }

      // Build array of identifiers for the viewer to try
      const identifiers = [];
      if (bookId) {
        identifiers.push(bookId);
        if (/^\d{10,13}$/.test(bookId)) identifiers.push(`ISBN:${bookId}`);
        if (bookId.includes("-")) identifiers.push(bookId.replace(/-/g, "/"));
        if (bookId.startsWith("-")) identifiers.push(bookId.slice(1));
      }
      if (locationISBNs && locationISBNs.length > 0) {
        locationISBNs.forEach((isbn) => identifiers.push(`ISBN:${isbn}`));
      }

      console.log("📚 Loading book with identifiers:", identifiers);

      // If there are no valid identifiers, bail out early — calling
      // the Google viewer with an empty identifier list can throw
      // inside the upstream script (observed as an uncaught error
      // coming from 3api.js). Avoid calling load with empty array.
      if (!identifiers || identifiers.length === 0) {
        console.warn("No valid identifiers available for Google Books viewer; skipping load.");
        onNotFound();
        return;
      }

      const onNotFound = () => {
        console.log("❌ Book preview not available in Google Books");
        console.log("   Tried identifiers:", identifiers);
        setViewer(null);
        setIsLoading(false);
      };

      const onSuccess = () => {
        console.log("✅ Google Books viewer loaded successfully for:", bookInfo?.title);
        setViewer(viewerRef.current);
        setIsLoading(false);
        
        // Setup page change tracking
        if (viewerRef.current && window.google?.books?.EventType?.PAGE_CHANGED) {
          try {
            window.google.books.addEventListener(viewerRef.current, window.google.books.EventType.PAGE_CHANGED, () => {
              const currentPageIndex = viewerRef.current.getCurrentPage?.();
              if (currentPageIndex !== undefined && currentPageIndex !== null) {
                setCurrentPage(currentPageIndex + 1); // Convert 0-based index to 1-based page number
              }
            });
          } catch (err) {
            console.log("Could not setup page change listener:", err);
          }
        }
      };

      // If we already created a viewer instance, reuse it (avoid recreating and DOM churn)
      if (viewerRef.current) {
        try {
          if (typeof viewerRef.current.load === "function") {
            viewerRef.current.load(identifiers, onNotFound, onSuccess);
            return;
          } else {
            console.warn("Existing viewer instance has no load() method — recreating viewer");
          }
        } catch (err) {
          console.warn("Existing viewer load failed, recreating. Error:", err);
          // fallthrough to recreate
        }
      }

      // Create a new DefaultViewer instance in the container
      const viewerInstance = new window.google.books.DefaultViewer(viewerContainer);
      viewerRef.current = viewerInstance;
      try {
        viewerInstance.load(identifiers, onNotFound, onSuccess);
      } catch (err) {
        console.error("Viewer load error:", err);
        onNotFound();
      }
    } catch (error) {
      console.error("❌ Google Books Embedded Viewer initialization error:", error);
      setViewer(null);
      setIsLoading(false);
    }
  }, [bookId, locationISBNs, volumeAccess, bookInfo]);

  // Fetch book info from Google Books API
  useEffect(() => {
    const fetchBookInfo = async () => {
      try {
        // First, use location state data if available
        if (location.state?.title) {
          setBookInfo({
            title: location.state.title,
            author: location.state.author || "Author",
            description: location.state.description || "No description available",
            pages: location.state.pages || 0,
            cover: location.state.cover_url || null,
            previewLink: locationPreviewLink || null,
          });
          return; // Don't do additional search if we have good data
        }

        const query = encodeURIComponent(`${bookTitle} ${bookAuthor}`);
        // Use server proxy to avoid exposing API key and reduce client-side rate limits
        const res = await fetch(`/api/search?q=${query}&page=1`);
        const data = await res.json();

        if (data && data.books && data.books.length > 0) {
          const book = data.books[0];
          setBookInfo({
            title: book.title || bookTitle,
            author: (book.author_name && book.author_name[0]) || book.author || bookAuthor,
            description: book.description || "No description available",
            pages: book.pageCount || book.pages || 0,
            cover: book.cover_url || book.imageLinks || null,
            previewLink: book.previewLink || null,
          });
        } else {
          setBookInfo({
            title: bookTitle,
            author: bookAuthor,
            description: "No description available",
            pages: 0,
            cover: null,
            previewLink: null,
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
          previewLink: null,
        });
      }
    };

    if (bookTitle) {
      fetchBookInfo();
    }
  }, [bookTitle, bookAuthor, locationPreviewLink, location.state]);

  // Fetch volume metadata (accessInfo) from server proxy when we have a bookId
  useEffect(() => {
    const fetchVolume = async () => {
      if (!bookId) return;
      try {
        const res = await fetch(`/api/google-books/volumes/${encodeURIComponent(bookId)}`);
        
        // 404 means volume not found in Google Books (likely legacy Open Library ID)
        if (res.status === 404) {
          console.warn(`⚠️ Volume ${bookId} not found in Google Books (may be legacy ID)`);
          return;
        }
        
        if (!res.ok) throw new Error(`Volume fetch failed: ${res.status}`);
        const data = await res.json();
        const vi = data.volumeInfo || {};
        setBookInfo((prev) => ({
          title: vi.title || prev?.title || prev?.title || "Book",
          author: vi.authors?.[0] || prev?.author || prev?.author || "Author",
          description: vi.description || prev?.description || "No description available",
          pages: vi.pageCount || prev?.pages || 0,
          cover: vi.imageLinks?.medium || vi.imageLinks?.thumbnail || prev?.cover || null,
          previewLink: vi.previewLink || null,
        }));
        setVolumeAccess(data.accessInfo || null);
      } catch (err) {
        // Fallback: keep using the title/author search (already handled by other effect)
        console.warn("Volume metadata fetch failed, falling back to search: ", err.message);
      }
    };

    fetchVolume();
  }, [bookId]);

  // Initialize Google Books Embedded Viewer API
  // Uses the official Google Books API Loader to ensure proper initialization
  useEffect(() => {
    if (!bookId) return;
    
    // Check if Google Books API is already loaded to avoid duplicate loading
    if (window.google?.books?.DefaultViewer) {
      initializeViewerInstance();
      return;
    }

    // Load the API script if not already present
    let script = document.querySelector('script[src*="google/books/jsapi"]');
    
    if (!script) {
      script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "https://www.google.com/books/jsapi.js";
      script.async = true;
      
      script.onerror = () => {
        console.error("❌ Failed to load Google Books Embedded Viewer API");
        setViewer(null);
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    }

    // Initialize viewer when API is ready
    const loadCallback = () => {
      if (bookId && viewerContainerRef.current) {
        initializeViewerInstance();
      }
    };

    // Use the official callback mechanism
    if (window.google?.books?.setOnLoadCallback) {
      window.google.books.setOnLoadCallback(loadCallback);
    } else if (script) {
      // For re-initialization scenarios
      script.onload = () => {
        window.google.books.load();
        window.google.books.setOnLoadCallback(loadCallback);
      };
    }

    return () => {
      // Cleanup script callback references if needed (we don't remove the script)
    };
  }, [bookId, initializeViewerInstance]);

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

  // Trigger viewer initialization when container ref is ready and API is loaded
  useEffect(() => {
    if (!bookId || !viewerContainerRef.current) return;
    if (!window.google?.books?.DefaultViewer) return;
    if (viewer) return; // Already initialized

    // Small delay to ensure everything is properly mounted
    const timer = setTimeout(() => {
      if (viewerContainerRef.current && window.google?.books?.DefaultViewer) {
        initializeViewerInstance();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [bookId, viewer, initializeViewerInstance]);

  const handleNextPage = () => {
    if (viewer && viewer.nextPage) {
      try {
        viewer.nextPage();
      } catch (error) {
        console.log("Cannot navigate to next page (may be on last page)", error);
      }
    }
  };

  const handlePreviousPage = () => {
    if (viewer && viewer.prevPage) {
      try {
        viewer.prevPage();
      } catch (error) {
        console.log("Cannot navigate to previous page (may be on first page)", error);
      }
    }
  };

  // Additional viewer controls from Google Books Embedded Viewer API
  const handleZoomIn = () => {
    if (viewer && viewer.zoomIn) {
      try {
        viewer.zoomIn();
      } catch (error) {
        console.log("Zoom in not available", error);
      }
    }
  };

  const handleZoomOut = () => {
    if (viewer && viewer.zoomOut) {
      try {
        viewer.zoomOut();
      } catch (error) {
        console.log("Zoom out not available", error);
      }
    }
  };

  const handleNoteAdded = (newNote) => {
    setNotes([newNote, ...notes]);
  };

  // Cleanup viewer on unmount to avoid DOM mutations that conflict with React
  useEffect(() => {
    return () => {
      try {
        // Try to call any cleanup on the viewer if available
        if (viewerRef.current && typeof viewerRef.current.clear === "function") {
          try { viewerRef.current.clear(); } catch { /* ignore */ }
        }

        // Null out references
        viewerRef.current = null;
      } catch {
        // Cleanup errors can be safely ignored
      }
    };
  }, []);

  if (isLoading && !bookInfo) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Loader className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 sm:p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-700 rounded transition flex-shrink-0"
            title="Go back"
          >
            <ChevronLeft size={20} className="text-white sm:w-6 sm:h-6" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-white truncate">{bookInfo?.title}</h1>
            <p className="text-xs sm:text-sm text-gray-400 truncate">{bookInfo?.author}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden gap-0">
        {/* Reader Content - Full width on mobile, 70% on lg screens */}
        <div className="flex flex-col overflow-hidden w-full lg:w-7/10">
          {/* Reader Viewport */}
          <div className="flex-1 overflow-auto p-2 sm:p-4 bg-gray-900">
            {/* Always render container so viewer can mount into it */}
            <div
              ref={viewerContainerRef}
              style={{
                width: "100%",
                height: "100%",
                minHeight: "500px",
                display: viewer ? "block" : "none",
              }}
            ></div>

            {/* Fallback UI when no preview available */}
            {!viewer && bookInfo && (
                <div className="max-w-4xl mx-auto w-full h-full overflow-auto">
                  <div className="bg-linear-to-b from-gray-800 to-gray-900 rounded-lg p-4 sm:p-6 lg:p-8 text-white min-h-full flex flex-col items-center justify-center">
                    <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start md:items-center max-w-2xl">
                      {/* Cover Image */}
                      <div className="shrink-0">
                        {bookInfo?.cover ? (
                          <img 
                            src={bookInfo.cover} 
                            alt={bookInfo?.title}
                            className="rounded-lg shadow-2xl h-48 sm:h-64 md:h-80 w-auto object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="bg-linear-to-br from-blue-500 to-purple-600 rounded-lg shadow-2xl h-48 sm:h-64 md:h-80 w-32 sm:w-40 md:w-56 flex items-center justify-center flex-shrink-0">
                            <BookOpen size={48} className="text-white opacity-50 sm:w-20 sm:h-20 md:w-24 md:h-24" />
                          </div>
                        )}
                      </div>

                      {/* Book Info */}
                      <div className="flex-1 min-w-0">
                        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 text-white line-clamp-3">
                          {bookInfo?.title}
                        </h1>
                        <p className="text-sm sm:text-base md:text-lg text-blue-400 mb-3 sm:mb-4 line-clamp-2">
                          by {bookInfo?.author}
                        </p>

                        {bookInfo?.pages > 0 && (
                          <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3">
                            <span className="font-semibold">Pages:</span> {bookInfo.pages}
                          </p>
                        )}

                        {bookInfo?.description && bookInfo.description !== "No description available" && (
                          <div className="mb-3 sm:mb-4">
                            <h3 className="font-bold text-xs sm:text-sm md:text-base text-white mb-1 sm:mb-2">About this book</h3>
                            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-h-24 sm:max-h-32 overflow-y-auto">
                              {typeof bookInfo.description === 'string' 
                                ? bookInfo.description 
                                : bookInfo.description?.value || "No description available"}
                            </p>
                          </div>
                        )}

                        <div className="bg-blue-900 bg-opacity-50 border border-blue-500 rounded-lg p-2 sm:p-3 mt-3 sm:mt-4 space-y-2 text-xs sm:text-sm">
                          <p className="text-xs font-semibold text-gray-200">
                            Preview not available from Google Books
                          </p>
                          
                          <div className="text-xs text-gray-300 bg-gray-800 bg-opacity-50 p-2 rounded border border-gray-700 space-y-1">
                            <p className="font-semibold">Why?</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              <li>Book may not be available in Google Books</li>
                              <li>Publisher restrictions on previews</li>
                              <li>Legacy book ID from old library</li>
                            </ul>
                            <p className="mt-2 space-y-1">
                              {bookInfo?.previewLink && (
                                <a 
                                  href={bookInfo.previewLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="block text-blue-400 hover:text-blue-300 underline truncate"
                                >
                                  📖 View on Google Books
                                </a>
                              )}
                              <a 
                                href={`https://www.google.com/books?q=${encodeURIComponent(bookInfo?.title)} ${encodeURIComponent(bookInfo?.author)}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block text-blue-400 hover:text-blue-300 underline truncate"
                              >
                                🔍 Search on Google Books
                              </a>
                            </p>
                          </div>

                          <div className="text-xs text-gray-300 bg-gray-800 bg-opacity-50 p-2 rounded border border-gray-700">
                            <p className="font-semibold mb-0.5">💡 Add Research Notes</p>
                            <p>Click the Notes button to add your own annotations.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Navigation Footer */}
          <div className="bg-gray-800 border-t border-gray-700 p-2 sm:p-4 flex items-center justify-between shrink-0">
            <button
              onClick={handlePreviousPage}
              disabled={!viewer}
              className="p-2 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition flex-shrink-0"
              title="Previous page (← Arrow)"
            >
              <ChevronLeft size={20} className="text-white sm:w-6 sm:h-6" />
            </button>

            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1 justify-center px-2">
              <span className="text-white font-medium text-xs sm:text-sm whitespace-nowrap">
                {viewer ? "📖 Preview" : "No preview"}
              </span>
              {viewer && (
                <div className="flex gap-1 border-l border-gray-600 pl-2 ml-2 flex-shrink-0">
                  <button
                    onClick={handleZoomOut}
                    disabled={!viewer}
                    className="p-1 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition text-xs text-gray-300"
                    title="Zoom out"
                  >
                    −
                  </button>
                  <button
                    onClick={handleZoomIn}
                    disabled={!viewer}
                    className="p-1 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition text-xs text-gray-300"
                    title="Zoom in"
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleNextPage}
              disabled={!viewer}
              className="p-2 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition flex-shrink-0"
              title="Next page (→ Arrow)"
            >
              <ChevronRight size={20} className="text-white sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Notes Sidebar - Full width on mobile, 30% on lg screens */}
        <div className="w-full lg:w-3/10 border-l-0 lg:border-l border-gray-700 flex flex-col border-t lg:border-t-0 mt-0">
          <NotesSidebar
            bookId={bookId}
            currentPage={currentPage}
            notes={notes}
            onNoteAdded={handleNoteAdded}
          />
        </div>
      </div>
    </div>
  );
}
