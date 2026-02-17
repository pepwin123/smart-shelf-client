import { useState } from "react";
import axios from "axios";
import NotesHeader from "./NotesHeader";
import NoteForm from "./NoteForm";
import NoteItem from "./NoteItem";

export default function NotesSidebar({ bookId, currentPage = 1, notes, onNoteAdded, onNoteUpdated }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editData, setEditData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartEdit = (note) => {
    setShowForm(false);
    setEditingNoteId(note._id);
    setEditData({
      content: note.content || "",
      chapterId: note.chapterId || "",
      pageNumber: note.pageNumber || currentPage,
      tags: (note.tags || []).join(", "),
    });
    setSelectedNote(note._id);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditData({});
  };

  const handleEditChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async (noteId) => {
    if (!editData.content.trim()) {
      alert("Note content cannot be empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `/api/notes/${noteId}`,
        {
          content: editData.content,
          chapterId: editData.chapterId || undefined,
          pageNumber: parseInt(editData.pageNumber) || undefined,
          tags: editData.tags ? editData.tags.split(",").map((t) => t.trim()) : undefined,
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

  const handlePinNote = async (noteId, isPinned) => {
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
      if (onNoteUpdated) onNoteUpdated({ _id: noteId, pinned: isPinned });
      alert(error.response?.data?.message || "Failed to update note");
    }
  };

  return (
    <div className="bg-gray-800 border-l border-gray-700 flex flex-col h-full w-full">
      <NotesHeader onAddClick={() => setShowForm(!showForm)} />

      {showForm && (
        <NoteForm
          bookId={bookId}
          currentPage={currentPage}
          onNoteAdded={(note) => {
            onNoteAdded(note);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No notes yet</p>
            <p className="text-xs mt-1">Add your first research note</p>
          </div>
        ) : (
          notes.map((note) => (
            <NoteItem
              key={note._id}
              note={note}
              isSelected={selectedNote === note._id}
              onSelect={() => setSelectedNote(selectedNote === note._id ? null : note._id)}
              onDelete={handleDeleteNote}
              onPin={handlePinNote}
              onEditStart={handleStartEdit}
              onEditCancel={handleCancelEdit}
              isEditing={editingNoteId === note._id}
              editData={editData}
              onEditChange={handleEditChange}
              onEditSave={handleSaveEdit}
              isSubmitting={isSubmitting}
            />
          ))
        )}
      </div>
    </div>
  );
}
