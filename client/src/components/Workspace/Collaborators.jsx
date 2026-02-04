import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Collaborators({ workspaceId }) {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!workspaceId) return;

    const fetchCollaborators = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/workspaces/${workspaceId}/collaborators`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCollaborators(res.data.collaborators || []);
      } catch (err) {
        console.error("Failed to fetch collaborators:", err);
        setError("Unable to load collaborators");
        setCollaborators([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollaborators();
  }, [workspaceId]);

  if (!workspaceId) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h4 className="text-white text-sm font-medium mb-3">Collaborators</h4>

      {loading && <p className="text-gray-300 text-xs">Loading...</p>}
      {error && <p className="text-red-400 text-xs">{error}</p>}

      {!loading && !error && (
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
          {collaborators.length === 0 ? (
            <p className="text-gray-400 text-xs">No collaborators</p>
          ) : (
            collaborators.map((c) => (
              <div key={c._id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                  {c.username ? c.username.charAt(0).toUpperCase() : c.email?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-sm">{c.username || "—"}</span>
                  <span className="text-gray-300 text-xs">{c.email}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
