export default function NoteEditForm({ editData, onEditChange, onSave, onCancel, isSubmitting }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-300 mb-1">Chapter/Section</label>
        <input
          type="text"
          value={editData.chapterId}
          onChange={(e) => onEditChange("chapterId", e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-300 mb-1">Page</label>
        <input
          type="number"
          min="1"
          value={editData.pageNumber}
          onChange={(e) => onEditChange("pageNumber", e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-300 mb-1">Content (Markdown)</label>
        <textarea
          value={editData.content}
          onChange={(e) => onEditChange("content", e.target.value)}
          rows="4"
          className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-300 mb-1">Tags (comma-separated)</label>
        <input
          type="text"
          value={editData.tags}
          onChange={(e) => onEditChange("tags", e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={isSubmitting}
          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-medium text-sm transition"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium text-sm transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
