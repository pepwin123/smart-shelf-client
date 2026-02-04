import React, { useState } from "react";
import axios from "axios";
import WorkspaceSelectorModal from "../Workspace/WorkspaceSelectorModal";

export default function AddManualBook({ isOpen, onClose }) {
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState("");
  const [subjects, setSubjects] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [availability, setAvailability] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [pendingAddToWorkspace, setPendingAddToWorkspace] = useState(null);

  if (!isOpen) return null;

  const reset = () => {
    setTitle("");
    setAuthors("");
    setYear("");
    setSubjects("");
    setCoverUrl("");
    setAvailability("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        key: `manual-${Date.now()}`,
        title,
        author_name: authors ? authors.split(",").map(a => a.trim()) : [],
        first_publish_year: year ? Number(year) : undefined,
        cover_i: null,
        subject: subjects ? subjects.split(",").map(s => s.trim()) : [],
        has_fulltext: availability === "readable",
        public_scan_b: availability === "borrowable",
        coverUrl: coverUrl || null,
      };

      const res = await axios.post("/api/books/books", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const saved = res.data.book || res.data;

      // If user chose to add directly to workspace, open workspace selector
      if (pendingAddToWorkspace) {
        // store the saved book temporarily and open selector
        setPendingAddToWorkspace(saved);
        setShowWorkspaceModal(true);
      } else {
        alert("Book added successfully");
        reset();
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to add book");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorkspace = async (workspaceId) => {
    if (!pendingAddToWorkspace) {
      // If no saved book in pending then just close
      setShowWorkspaceModal(false);
      onClose();
      return;
    }

    try {
      const book = pendingAddToWorkspace;
      const token = localStorage.getItem("token");
      await axios.post(
        `/api/workspaces/${workspaceId}/cards`,
        {
          columnId: "to-read",
          bookId: book.openLibraryId || book._id || book.key || `book-${Date.now()}`,
          title: book.title,
          author: (book.authors || book.author_name || []).join(", "),
          cover: book.coverUrl || null,
          metadata: book,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Book saved and added to workspace");
      setShowWorkspaceModal(false);
      setPendingAddToWorkspace(null);
      reset();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to add book to workspace");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Add Manual Book</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Authors (comma separated)</label>
              <input value={authors} onChange={(e) => setAuthors(e.target.value)} className="w-full p-2 border rounded" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <input value={year} onChange={(e) => setYear(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subjects (comma)</label>
                <input value={subjects} onChange={(e) => setSubjects(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Availability</label>
                <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="w-full p-2 border rounded">
                  <option value="">None</option>
                  <option value="readable">Readable</option>
                  <option value="borrowable">Borrowable</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Cover URL (optional)</label>
              <input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} className="w-full p-2 border rounded" />
            </div>

            <div className="flex items-center gap-3">
              <input id="add-to-ws" type="checkbox" onChange={(e) => setPendingAddToWorkspace(e.target.checked ? true : null)} />
              <label htmlFor="add-to-ws" className="text-sm text-gray-700">Also add to a workspace</label>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? "Saving..." : "Save Book"}</button>
            </div>
          </form>
        </div>
      </div>

      <WorkspaceSelectorModal isOpen={showWorkspaceModal} onClose={() => setShowWorkspaceModal(false)} onSelect={handleSelectWorkspace} />
    </>
  );
}
