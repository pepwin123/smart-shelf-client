import { Loader, BookOpen } from "lucide-react";

export const ReaderViewport = ({ 
  viewer, 
  viewerContainerRef, 
  bookInfo, 
  localFileLoading, 
  localFileError, 
  localFileText 
}) => {
  return (
    <div className="flex-1 overflow-auto p-2 sm:p-4 bg-gray-900">
      {/* Google Books Viewer Container */}
      <div
        ref={viewerContainerRef}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "500px",
          display: viewer ? "block" : "none",
        }}
      ></div>

      {/* Local PDF Preview */}
      {!viewer && bookInfo?.previewLink && bookInfo.previewLink.includes("/uploads/") && bookInfo.previewLink.toLowerCase().endsWith(".pdf") && (
        <div className="w-full h-full">
          <iframe
            title="Local PDF Preview"
            src={bookInfo.previewLink}
            className="w-full h-full border-0"
          />
          <div className="text-center mt-2">
            <a href={bookInfo.previewLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
              Open PDF in new tab / download
            </a>
          </div>
        </div>
      )}

      {/* Loading State */}
      {!viewer && localFileLoading && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader className="animate-spin text-blue-500 mx-auto mb-4" size={32} />
            <p className="text-gray-400">Loading preview…</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!viewer && localFileError && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <p className="text-red-400 mb-2">Error loading file:</p>
            <p className="text-gray-400 text-sm">{localFileError}</p>
          </div>
        </div>
      )}

      {/* Text File Preview */}
      {!viewer && localFileText && (
        <div className="h-full overflow-auto bg-gray-800 p-4 sm:p-6">
          <pre
            style={{
              backgroundColor: "#1a1a1a",
              padding: "15px",
              borderRadius: "4px",
              fontSize: "12px",
              lineHeight: "1.6",
              fontFamily: "'Courier New', monospace",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              border: "1px solid #333",
              color: "#e0e0e0",
            }}
          >
            {localFileText}
          </pre>
          {bookInfo?.previewLink && (
            <div className="mt-4 flex justify-center">
              <a
                href={bookInfo.previewLink}
                download
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
              >
                Download File
              </a>
            </div>
          )}
        </div>
      )}

      {/* Extracted Content Preview */}
      {!viewer && bookInfo?.extractedContent && !localFileText && (
        <div className="h-full overflow-auto bg-gray-800 p-4 sm:p-6">
          <pre
            style={{
              backgroundColor: "#1a1a1a",
              padding: "15px",
              borderRadius: "4px",
              fontSize: "12px",
              lineHeight: "1.6",
              fontFamily: "'Courier New', monospace",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              border: "1px solid #333",
              color: "#e0e0e0",
            }}
          >
            {bookInfo.extractedContent}
          </pre>
          {bookInfo?.previewLink && (
            <div className="mt-4 flex justify-center">
              <a
                href={bookInfo.previewLink}
                download
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
              >
                Download File
              </a>
            </div>
          )}
        </div>
      )}

      {/* Fallback: Book Info Display */}
      {!viewer && bookInfo && !localFileText && !localFileLoading && !bookInfo?.extractedContent && (
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
                  <div className="bg-linear-to-br from-blue-500 to-purple-600 rounded-lg shadow-2xl h-48 sm:h-64 md:h-80 w-32 sm:w-40 md:w-56 flex items-center justify-center shrink-0">
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
  );
};
