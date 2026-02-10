import React, { useState } from "react";
import axios from "axios";
import { X, Plus, Trash2, Pin, Edit } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function NotesSidebar({ bookId, currentPage = 1, notes, onNoteAdded, onNoteUpdated }) {
  const [showForm, setShowForm] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [pageNumber, setPageNumber] = useState(currentPage);
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editChapterId, setEditChapterId] = useState("");
  const [editPageNumber, setEditPageNumber] = useState(currentPage);
  const [editTags, setEditTags] = useState("");

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim()) {
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
          chapterId: chapterId || `chapter-${Math.random()}`,
          pageNumber: parseInt(pageNumber) || 1,
          content: newNoteContent,
          tags: tags
            ? tags.split(",").map((tag) => tag.trim())
            : [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onNoteAdded(res.data.note);
      setNewNoteContent("");
      setChapterId("");
      setPageNumber(currentPage);
      setTags("");
      setShowForm(false);
      alert("✅ Note created successfully!");
    } catch (error) {
      console.error("Failed to create note:", error);
      alert(error.response?.data?.message || "Failed to create note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("✅ Note deleted successfully!");
    } catch (error) {
      console.error("Failed to delete note:", error);
      alert("Failed to delete note");
    }
  };

  const handleStartEdit = (note) => {
    // Close create form if open
    setShowForm(false);
    setEditingNoteId(note._id);
    setEditContent(note.content || "");
    setEditChapterId(note.chapterId || "");
    setEditPageNumber(note.pageNumber || currentPage);
    setEditTags((note.tags || []).join(", "));
    // ensure note is expanded for editing UI
    setSelectedNote(note._id);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditContent("");
    setEditChapterId("");
    setEditPageNumber(currentPage);
    setEditTags("");
  };

  const handleSaveEdit = async (noteId) => {
    if (!editContent.trim()) {
      alert("Note content cannot be empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `/api/notes/${noteId}`,
        {
          content: editContent,
          chapterId: editChapterId || undefined,
          pageNumber: parseInt(editPageNumber) || undefined,
          tags: editTags ? editTags.split(",").map((t) => t.trim()) : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedNote = res.data?.note;
      if (onNoteUpdated && updatedNote) onNoteUpdated(updatedNote);
      setEditingNoteId(null);
      alert("✅ Note saved!");
    } catch (error) {
      console.error("Failed to save note:", error);
      alert(error.response?.data?.message || "Failed to save note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinNote = async (noteId, isPinned) => {
    // Optimistic update: update UI immediately, revert on error
    const optimistic = { _id: noteId, pinned: !isPinned, updatedAt: new Date().toISOString() };
    if (onNoteUpdated) onNoteUpdated(optimistic);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `/api/notes/${noteId}`,
        { pinned: !isPinned },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedNote = res.data?.note;
      if (onNoteUpdated && updatedNote) onNoteUpdated(updatedNote);
      alert("✅ Note updated!");
    } catch (error) {
      console.error("Failed to pin note:", error);
      // Revert optimistic change
      if (onNoteUpdated) onNoteUpdated({ _id: noteId, pinned: isPinned });
      alert(error.response?.data?.message || "Failed to update note");
    }
  };

  return (
    <div className="bg-gray-800 border-l border-gray-700 flex flex-col h-full w-full">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between shrink-0">
        <h2 className="text-lg font-bold text-white">Research Notes</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-2 hover:bg-gray-700 rounded transition text-blue-400 hover:text-blue-300"
          title="Add new note"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Add Note Form */}
      {showForm && (
        <div className="border-b border-gray-700 p-4 space-y-3 bg-gray-750 shrink-0 overflow-y-auto max-h-80">
          <form onSubmit={handleCreateNote} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Chapter/Section
              </label>
              <input
                type="text"
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                placeholder="e.g., Chapter 3"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Page
              </label>
              <input
                type="number"
                min="1"
                value={pageNumber}
                onChange={(e) => setPageNumber(e.target.value)}
                placeholder="Enter page number"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                This note will be attached to page {pageNumber || '—'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Content (Markdown)
              </label>
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Write your note in markdown..."
                rows="4"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
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
                onClick={() => {
                  setShowForm(false);
                  setNewNoteContent("");
                  setChapterId("");
                  setTags("");
                }}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium text-sm transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No notes yet</p>
            <p className="text-xs mt-1">Add your first research note</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note._id}
              onClick={() => setSelectedNote(selectedNote === note._id ? null : note._id)}
              className={`bg-gray-700 rounded p-3 cursor-pointer transition ${
                selectedNote === note._id ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {/* Note Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-blue-400 truncate">
                      {note.chapterId || "General"}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      Page {note.pageNumber}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-1 shrink-0 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePinNote(note._id, note.pinned);
                    }}
                    className={`p-1 rounded transition ${
                      note.pinned
                        ? "text-yellow-400 hover:text-yellow-300"
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                    title="Pin note"
                  >
                    <Pin size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(note);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-300 rounded transition"
                    title="Edit note"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note._id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-400 rounded transition"
                    title="Delete note"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Note Content Preview */}
              <div className="text-sm text-gray-300 line-clamp-2">
                {note.content.substring(0, 100)}
                {note.content.length > 100 ? "..." : ""}
              </div>

              {/* Tags */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-2 py-1 bg-blue-900 text-blue-200 text-xs rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Full Content (when selected) */}
              {selectedNote === note._id && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  {editingNoteId === note._id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Chapter/Section</label>
                        <input
                          type="text"
                          value={editChapterId}
                          onChange={(e) => setEditChapterId(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Page</label>
                        <input
                          type="number"
                          min="1"
                          value={editPageNumber}
                          onChange={(e) => setEditPageNumber(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Content (Markdown)</label>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows="4"
                          className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Tags (comma-separated)</label>
                        <input
                          type="text"
                          value={editTags}
                          onChange={(e) => setEditTags(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSaveEdit(note._id); }}
                          disabled={isSubmitting}
                          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-medium text-sm transition"
                        >
                          {isSubmitting ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium text-sm transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm prose-invert max-w-none text-gray-300">
                      <ReactMarkdown>{note.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
