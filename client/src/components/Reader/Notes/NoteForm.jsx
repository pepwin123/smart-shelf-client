import { useState } from "react";
import axios from "axios";

export default function NoteForm({ bookId, currentPage = 1, onNoteAdded, onCancel }) {
  const [formData, setFormData] = useState({
    chapterId: "",
    pageNumber: currentPage,
    content: "",
    tags: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      alert("Note content cannot be empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/notes",
        {
          googleBooksVolumeId: bookId,
          chapterId: formData.chapterId || `chapter-${Math.random()}`,
          pageNumber: parseInt(formData.pageNumber) || 1,
          content: formData.content,
          tags: formData.tags ? formData.tags.split(",").map((tag) => tag.trim()) : [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onNoteAdded(res.data.note);
      setFormData({ chapterId: "", pageNumber: currentPage, content: "", tags: "" });
      alert("✅ Note created successfully!");
    } catch (error) {
      console.error("Failed to create note:", error);
      alert(error.response?.data?.message || "Failed to create note");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-b border-gray-700 p-4 space-y-3 bg-gray-750 shrink-0 overflow-y-auto max-h-80">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Chapter/Section</label>
          <input
            type="text"
            name="chapterId"
            value={formData.chapterId}
            onChange={handleChange}
            placeholder="e.g., Chapter 3"
            className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Page</label>
          <input
            type="number"
            name="pageNumber"
            min="1"
            value={formData.pageNumber}
            onChange={handleChange}
            placeholder="Enter page number"
            className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            This note will be attached to page {formData.pageNumber || '—'}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Content (Markdown)</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Write your note in markdown..."
            rows="4"
            className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g., important, algorithm, review"
            className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-medium text-sm transition"
          >
            {isSubmitting ? "Saving..." : "Save Note"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium text-sm transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
