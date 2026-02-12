import { ChevronLeft, ChevronRight } from "lucide-react";

export const ReaderHeader = ({ bookInfo, navigate, onToggleSidebar }) => (
  <div className="bg-gray-800 border-b border-gray-700 p-3 sm:p-4 flex items-center justify-between shrink-0">
    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
      <button
        onClick={() => navigate(-1)}
        className="p-2 hover:bg-gray-700 rounded transition shrink-0"
        title="Go back"
      >
        <ChevronLeft size={20} className="text-white sm:w-6 sm:h-6" />
      </button>
      <div className="min-w-0">
        <h1 className="text-base sm:text-xl font-bold text-white truncate">{bookInfo?.title}</h1>
        <p className="text-xs sm:text-sm text-gray-400 truncate">{bookInfo?.author}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={onToggleSidebar}
        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-sm text-white rounded transition"
        title="Toggle notes sidebar"
      >
        Notes
      </button>
    </div>
  </div>
);

export const ReaderFooter = ({ viewer, onNextPage, onPreviousPage, onZoomIn, onZoomOut }) => (
  <div className="bg-gray-800 border-t border-gray-700 p-2 sm:p-4 flex items-center justify-between shrink-0">
    <button
      onClick={onPreviousPage}
      disabled={!viewer}
      className="p-2 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition shrink-0"
      title="Previous page (← Arrow)"
    >
      <ChevronLeft size={20} className="text-white sm:w-6 sm:h-6" />
    </button>

    <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1 justify-center px-2">
      <span className="text-white font-medium text-xs sm:text-sm whitespace-nowrap">
        {viewer ? "📖 Preview" : "No preview"}
      </span>
      {viewer && (
        <div className="flex gap-1 border-l border-gray-600 pl-2 ml-2 shrink-0">
          <button
            onClick={onZoomOut}
            disabled={!viewer}
            className="p-1 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition text-xs text-gray-300"
            title="Zoom out"
          >
            −
          </button>
          <button
            onClick={onZoomIn}
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
      onClick={onNextPage}
      disabled={!viewer}
      className="p-2 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition shrink-0"
      title="Next page (→ Arrow)"
    >
      <ChevronRight size={20} className="text-white sm:w-6 sm:h-6" />
    </button>
  </div>
);
