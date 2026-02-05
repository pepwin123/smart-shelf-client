import React, { useState } from "react";
import axios from "axios";
import { X } from "lucide-react";
import WorkspaceSelectorModal from "../Workspace/WorkspaceSelectorModal";

export default function AddManualBook({ isOpen, onClose }) {
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState("");
  const [subjects, setSubjects] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState("");
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
    setCoverFile(null);
    setCoverPreview("");
    setPdfFile(null);
    setPdfName("");
    setAvailability("");
  };

  const handleCoverFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    setCoverFile(file);
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeCoverImage = () => {
    setCoverFile(null);
    setCoverPreview("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let uploadedCoverUrl = null;
      
      // If user selected a cover image, upload it first
      if (coverFile) {
        const formData = new FormData();
        formData.append("file", coverFile);
        const uploadRes = await axios.post("/api/books/upload-cover", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        uploadedCoverUrl = uploadRes.data.url;
      }

      let uploadedPdfUrl = null;
      // If user selected a PDF, upload it
      if (pdfFile) {
        const formData = new FormData();
        formData.append("file", pdfFile);
        const uploadRes = await axios.post("/api/books/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        uploadedPdfUrl = uploadRes.data.url;
      }

      const payload = {
        key: `manual-${Date.now()}`,
        title,
        author_name: authors ? authors.split(",").map(a => a.trim()) : [],
        first_publish_year: year ? Number(year) : undefined,
        cover_i: null,
        subject: subjects ? subjects.split(",").map(s => s.trim()) : [],
        has_fulltext: availability === "readable",
        public_scan_b: availability === "borrowable",
        coverUrl: uploadedCoverUrl || null,
        contentUrl: uploadedPdfUrl || null,
      };

      const res = await axios.post("/api/books/books", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const saved = res.data.book || res.data;

      // If user chose to add directly to workspace, open workspace selector
      if (pendingAddToWorkspace) {
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Please select a PDF file");
      return;
    }
    setPdfFile(file);
    setPdfName(file.name);
  };

  const handleSelectWorkspace = async (workspaceId) => {
    if (!pendingAddToWorkspace) {
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 my-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Add Manual Book</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 max-h-96 overflow-y-auto">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image (optional)</label>
              {coverPreview ? (
                <div className="relative inline-block">
                  <img src={coverPreview} alt="Cover preview" className="h-32 w-24 object-cover rounded border" />
                  <button
                    type="button"
                    onClick={removeCoverImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="text-sm text-gray-500 mb-2">No cover image</div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleCoverFileChange} 
                className="w-full p-2 border rounded mt-2"
                title="Upload a cover image (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Upload PDF (optional)</label>
              <input type="file" accept="application/pdf" onChange={handleFileChange} className="w-full p-2 border rounded" />
              {pdfName && <p className="text-xs text-gray-600 mt-1">Selected: {pdfName}</p>}
            </div>

            <div className="flex items-center gap-3">
              <input id="add-to-ws" type="checkbox" onChange={(e) => setPendingAddToWorkspace(e.target.checked ? true : null)} />
              <label htmlFor="add-to-ws" className="text-sm text-gray-700">Also add to a workspace</label>
            </div>

            <div className="flex justify-end gap-2 sticky bottom-0 bg-white pt-3">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400">{loading ? "Saving..." : "Save Book"}</button>
            </div>
          </form>
        </div>
      </div>

      <WorkspaceSelectorModal isOpen={showWorkspaceModal} onClose={() => setShowWorkspaceModal(false)} onSelect={handleSelectWorkspace} />
    </>
  );
}
