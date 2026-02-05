import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import WorkspaceBoard from "./WorkspaceBoard";
import Header from "../Navbar/navbar";

export default function Workspace({ setUser }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState("");
  const [socket, setSocket] = useState(null);

  // Function to fetch all workspaces
  const fetchWorkspaces = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/workspaces", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkspaces(res.data.workspaces);
      setIsLoading(false);

      if (res.data.workspaces.length > 0 && !selectedWorkspaceId) {
        const firstId = res.data.workspaces[0]._id;
        setSelectedWorkspaceId(firstId);
        try { localStorage.setItem('lastWorkspaceId', firstId); } catch(err) {
          console.error('Failed to set localStorage:', err);
        }
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
      setIsLoading(false);
    }
  }, [selectedWorkspaceId]);

  // Function to create a new workspace
  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/workspaces",
        { name: newWorkspaceName, description: newWorkspaceDesc },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWorkspaces([...workspaces, res.data.workspace]);
      const newId = res.data.workspace._id;
      setSelectedWorkspaceId(newId);
      try { localStorage.setItem('lastWorkspaceId', newId); } catch(err) {
        console.error('Failed to set localStorage:', err);
      }
      setNewWorkspaceName("");
      setNewWorkspaceDesc("");
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create workspace:", error);
    }
  };

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  // Join/leave socket.io workspace room when selection changes
  useEffect(() => {
    if (!socket) return;
    let previous = null;
    // store previous id on the socket instance to track
    try {
      previous = socket.__currentWorkspaceId || null;
    } catch (err) {
      console.error('Failed to get workspace ID:', err);
      previous = null;
    }

    if (previous && previous !== selectedWorkspaceId) {
      socket.emit("leave-workspace", previous);
    }

    if (selectedWorkspaceId) {
      socket.emit("join-workspace", selectedWorkspaceId);
      socket.__currentWorkspaceId = selectedWorkspaceId;
    }

    return () => {
      if (socket && selectedWorkspaceId) {
        socket.emit("leave-workspace", selectedWorkspaceId);
        socket.__currentWorkspaceId = null;
      }
    };
  }, [socket, selectedWorkspaceId]);

  // Fetch all workspaces on mount
  useEffect(() => {
    fetchWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <>
        <Header setUser={setUser} />
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-xl text-white">Loading workspaces...</div>
        </div>
      </>
    );
  }

  return (
    <div>
      <Header setUser={setUser} />
      <div className="pt-20 min-h-screen bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Top Controls - Horizontal Layout */}
          <div className="flex gap-4 mb-6 flex-wrap">
            {/* Select Workspace + Create Button */}
            <div className="bg-gray-800 rounded-lg p-4 flex-1 min-w-64">
              <label className="block text-white text-sm font-medium mb-2">
                Select Workspace
              </label>
              <select
                value={selectedWorkspaceId || ""}
                onChange={(event) => {
                  const val = event.target.value;
                  setSelectedWorkspaceId(val);
                  try { localStorage.setItem('lastWorkspaceId', val); } catch(err) {
                    console.error('Failed to set localStorage:', err);
                  }
                }}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 outline-none text-sm mb-3"
              >
                <option value="">Choose a workspace...</option>
                {workspaces.map((ws) => (
                  <option key={ws._id} value={ws._id}>
                    {ws.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium text-sm transition"
              >
                {showCreateForm ? "Cancel" : "+ New Workspace"}
              </button>
            </div>
          </div>

          {/* Create Workspace Form - Below if shown */}
          {showCreateForm && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6 max-w-md">
              <form onSubmit={handleCreateWorkspace} className="space-y-2">
                <input
                  type="text"
                  placeholder="Workspace name"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full p-2 bg-gray-700 text-white rounded text-sm border border-gray-600 focus:border-blue-500 outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  className="w-full p-2 bg-gray-700 text-white rounded text-sm border border-gray-600 focus:border-blue-500 outline-none"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded font-medium text-sm transition"
                >
                  Create
                </button>
              </form>
            </div>
          )}

          {/* Main Board Area */}
          {selectedWorkspaceId ? (
            <WorkspaceBoard workspaceId={selectedWorkspaceId} socket={socket} />
          ) : (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400">Select a workspace to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
