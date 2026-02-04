import React, { useState, useEffect } from "react";
import axios from "axios";
import { X } from "lucide-react";

export default function WorkspaceSelectorModal({ isOpen, onClose, onSelect }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchWorkspaces = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/workspaces", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWorkspaces(res.data.workspaces || []);
      } catch (err) {
        console.error("Failed to fetch workspaces:", err);
        setError("Failed to load workspaces");
        setWorkspaces([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Select Workspace</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading workspaces...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Workspaces list */}
        {!loading && !error && workspaces.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {workspaces.map((ws) => (
              <button
                key={ws._id}
                onClick={() => {
                  onSelect(ws._id);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-lg bg-gray-100 hover:bg-blue-100 transition border border-gray-300 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="font-semibold text-gray-900">{ws.name}</div>
                {ws.description && (
                  <div className="text-sm text-gray-600">{ws.description}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && workspaces.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No workspaces found</p>
            <a
              href="/workspace"
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              Create one now
            </a>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-medium transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
