import { useEffect, useCallback, useState } from "react";

export const useGoogleBooksViewer = (bookId, locationISBNs, volumeAccess, bookInfo, viewerRef, viewerContainerRef) => {
  const [viewer, setViewer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const initializeViewerInstance = useCallback(() => {
    try {
      const viewerContainer = viewerContainerRef.current;
      if (!viewerContainer) {
        setIsLoading(false);
        return;
      }

      if (volumeAccess && volumeAccess.embeddable === false) {
        setViewer(null);
        setIsLoading(false);
        return;
      }

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

      //book in local file upload format - skip viewer
      if (bookId && (bookId.startsWith("manual-") || (bookInfo?.previewLink && bookInfo.previewLink.includes("/uploads/")))) {
        setViewer(null);
        setIsLoading(false);
        return;
      }

      // If no valid identifiers, skip viewer
      if (!identifiers || identifiers.length === 0) {
        console.warn("No valid identifiers available for Google Books viewer; skipping load.");
        setViewer(null);
        setIsLoading(false);
        return;
      }

      const onNotFound = () => {
        setViewer(null);
        setIsLoading(false);
      };

      const onSuccess = () => {
        setViewer(viewerRef.current);
        setIsLoading(false);

        if (viewerRef.current && window.google?.books?.EventType?.PAGE_CHANGED) {
          try {
            window.google.books.addEventListener(viewerRef.current, window.google.books.EventType.PAGE_CHANGED, () => {
              const currentPageIndex = viewerRef.current.getCurrentPage?.();
              if (currentPageIndex !== undefined && currentPageIndex !== null) {
                // Handle page change if needed
              }
            });
          } catch (err) {
            console.log("Could not setup page change listener:", err);
          }
        }
      };

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
        }
      }

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
  }, [bookId, locationISBNs, volumeAccess, bookInfo, viewerRef, viewerContainerRef]);

  // Load Google Books API
  useEffect(() => {
    if (!bookId) return;
    
    if (window.google?.books?.DefaultViewer) {
      // API already loaded, initialize viewer asynchronously
      setTimeout(() => initializeViewerInstance(), 0);
      return;
    }

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

    const loadCallback = () => {
      if (bookId && viewerContainerRef.current) {
        initializeViewerInstance();
      }
    };

    if (window.google?.books?.setOnLoadCallback) {
      window.google.books.setOnLoadCallback(loadCallback);
    } else if (script) {
      script.onload = () => {
        window.google.books.load();
        window.google.books.setOnLoadCallback(loadCallback);
      };
    }

    return () => {
      try {
        if (viewerRef.current && typeof viewerRef.current.clear === "function") {
          try { 
                viewerRef.current.clear(); 
              } catch (cleanupError) {
                console.error("Cleanup error:", cleanupError);
              }
        }
        viewerRef.current = null;
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, initializeViewerInstance]);

  return { viewer, isLoading };
};

export const useLocalFilePreview = (previewLink) => {
  const [localFileText, setLocalFileText] = useState(null);
  const [localFileLoading, setLocalFileLoading] = useState(false);
  const [localFileError, setLocalFileError] = useState(null);

  useEffect(() => {
    // Early return if no preview link
    if (!previewLink) {
      return;
    }

    const isLocalUpload = previewLink.includes("/uploads/");
    const lower = previewLink.toLowerCase();
    const isTextFile = lower.endsWith(".txt") || lower.endsWith(".md") || lower.endsWith(".log") || lower.endsWith(".text");

    if (isLocalUpload && isTextFile) {
      // Wrap setState in setTimeout to avoid synchronous calls in effect
      setTimeout(() => {
        setLocalFileLoading(true);
        setLocalFileError(null);
      }, 0);
      fetch(previewLink)
        .then(async (res) => {
          if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
          const text = await res.text();
          setLocalFileText(text);
        })
        .catch((err) => {
          console.error("Failed to load local text file preview:", err);
          setLocalFileError(err.message || "Failed to load file");
          setLocalFileText(null);
        })
        .finally(() => setLocalFileLoading(false));
    } else {
      setTimeout(() => {
        setLocalFileText(null);
        setLocalFileError(null);
        setLocalFileLoading(false);
      }, 0);
    }
  }, [previewLink]);

  return { localFileText, localFileLoading, localFileError };
};
