import { useState, useEffect, useMemo, useRef } from "react";
import { Loader } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import NotesSidebar from "./NotesSidebar";
import { ReaderHeader, ReaderFooter } from "./ReaderControls";
import { ReaderViewport } from "./ReaderViewport";
import { useGoogleBooksViewer, useLocalFilePreview } from "./useReaderHooks";

export default function Reader() {
  const { bookId: encodedBookId } = useParams();
  const bookId = decodeURIComponent(encodedBookId || "");
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotesSidebar, setShowNotesSidebar] = useState(true);
  const [notes, setNotes] = useState([]);
  const [bookInfo, setBookInfo] = useState(null);
  const [currentPage] = useState(1);
  
  const bookTitle = location.state?.title || "Book";
  const bookAuthor = location.state?.author || "Author";
  const locationISBNs = useMemo(() => location.state?.isbns || [], [location.state?.isbns]);
  const locationPreviewLink = location.state?.previewLink || location.state?.contentUrl;

  const viewerRef = useRef(null);
  const viewerContainerRef = useRef(null);

  // Use custom hooks for viewer and local file
  const { viewer, isLoading: viewerLoading } = useGoogleBooksViewer(
    bookId,
    locationISBNs,
    null,
    bookInfo,
    viewerRef,
    viewerContainerRef
  );

  const { localFileText, localFileLoading, localFileError } = useLocalFilePreview(bookInfo?.previewLink);

  // Fetch book info
  useEffect(() => {
    const fetchBookInfo = async () => {
      try {
        if (bookId) {
          try {
            const res = await fetch(`/api/google-books/volumes/${encodeURIComponent(bookId)}`);
            if (res.ok) {
              const data = await res.json();
              const vi = data.volumeInfo || {};
              setBookInfo({
                title: vi.title || location.state?.title || bookTitle || "Book",
                author: vi.authors?.[0] || location.state?.author || bookAuthor || "Author",
                description: vi.description || location.state?.description || "No description available",
                pages: vi.pageCount || location.state?.pages || 0,
                cover: vi.imageLinks?.medium || vi.imageLinks?.thumbnail || location.state?.cover_url || null,
                previewLink: vi.previewLink || data.contentUrl || locationPreviewLink || null,
                extractedContent: data.extractedContent || location.state?.extractedContent || null,
              });
              return;
            }
          } catch (apiErr) {
            // If API fails, fall back to location.state
            if (location.state?.previewLink || location.state?.contentUrl) {
              setBookInfo({
                title: location.state.title || bookTitle,
                author: location.state.author || bookAuthor,
                description: location.state.description || "No description available",
                pages: location.state.pages || 0,
                cover: location.state.cover_url || null,
                previewLink: location.state.previewLink || location.state.contentUrl || null,
                extractedContent: location.state.extractedContent || null,
              });
              return;
            }
            console.warn("API fetch failed, no preview/contentUrl in location.state:", apiErr.message);
          }
        }

        if (location.state?.title || location.state?.previewLink || location.state?.contentUrl) {
          setBookInfo({
            title: location.state.title || bookTitle,
            author: location.state.author || bookAuthor,
            description: location.state.description || "No description available",
            pages: location.state.pages || 0,
            cover: location.state.cover_url || null,
            previewLink: location.state.previewLink || location.state.contentUrl || null,
            extractedContent: location.state.extractedContent || null,
          });
          return;
        }

        const query = encodeURIComponent(`${bookTitle} ${bookAuthor}`);
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
            extractedContent: null,
          });
        } else {
          setBookInfo({
            title: bookTitle,
            author: bookAuthor,
            description: "No description available",
            pages: 0,
            cover: null,
            previewLink: null,
            extractedContent: null,
          });
        }
      } catch {
        console.log("Could not fetch book info");
        setBookInfo({
          title: bookTitle,
          author: bookAuthor,
          description: "No description available",
          pages: 0,
          cover: null,
          previewLink: null,
          extractedContent: null,
        });
      }
    };

    if (bookId || (location.state?.title && bookTitle)) {
      fetchBookInfo();
    }
  }, [bookId, bookTitle, bookAuthor, locationPreviewLink, location.state]);

  // Fetch research notes
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
      try {
        viewer.nextPage();
      } catch (error) {
        console.log("Cannot navigate to next page", error);
      }
    }
  };

  const handlePreviousPage = () => {
    if (viewer && viewer.prevPage) {
      try {
        viewer.prevPage();
      } catch (error) {
        console.log("Cannot navigate to previous page", error);
      }
    }
  };

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
    setNotes((prev) => sortNotes([newNote, ...prev]));
  };

  const handleNoteUpdated = (updatedNote) => {
    setNotes((prev) => {
      const merged = prev.map((n) => (n._id === updatedNote._id ? { ...n, ...updatedNote } : n));
      const exists = merged.some((n) => n._id === updatedNote._id);
      if (!exists) merged.unshift(updatedNote);
      return sortNotes(merged);
    });
  };

  const sortNotes = (list) => {
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  };

  if (viewerLoading && !bookInfo) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Loader className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <ReaderHeader 
        bookInfo={bookInfo} 
        navigate={navigate}
        onToggleSidebar={() => setShowNotesSidebar((s) => !s)}
      />

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden gap-0">
        <div className="flex flex-col overflow-hidden w-full lg:w-7/10">
          <ReaderViewport 
            viewer={viewer}
            viewerContainerRef={viewerContainerRef}
            bookInfo={bookInfo}
            localFileLoading={localFileLoading}
            localFileError={localFileError}
            localFileText={localFileText}
          />

          <ReaderFooter 
            viewer={viewer}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
          />
        </div>

        {showNotesSidebar && (
          <div className="w-full lg:w-3/10 border-l-0 lg:border-l border-gray-700 flex flex-col border-t lg:border-t-0 mt-0">
            <NotesSidebar
              bookId={bookId}
              currentPage={currentPage}
              notes={notes}
              onNoteAdded={handleNoteAdded}
              onNoteUpdated={handleNoteUpdated}
            />
          </div>
        )}
      </div>
    </div>
  );
}
