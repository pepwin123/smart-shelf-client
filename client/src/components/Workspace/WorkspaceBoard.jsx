import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import axios from "axios";
import { Trash2 } from "lucide-react";

// Draggable Card Component
function DraggableCard({ id, card, columnId, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-gray-600 p-3 rounded shadow-lg hover:shadow-xl transition cursor-grab active:cursor-grabbing group"
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate text-sm">
            {card.title}
          </p>
          {card.author && (
            <p className="text-gray-300 text-xs truncate">
              {card.author}
            </p>
          )}
        </div>
        <button
          onClick={() => onDelete(columnId, card.id)}
          className="text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
          title="Delete card"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

// Drop Zone for empty columns
function ColumnDropZone({ columnId }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${columnId}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-96 rounded p-3 transition ${
        isOver
          ? "bg-blue-500 bg-opacity-20 border-2 border-blue-500"
          : "bg-gray-700 bg-opacity-30 border-2 border-transparent"
      }`}
    >
      {!isOver && (
        <div className="text-center text-gray-500 text-sm py-8">
          Drop cards here
        </div>
      )}
    </div>
  );
}

export default function WorkspaceBoard({ workspaceId, socket }) {
  const [workspace, setWorkspace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openColumnId, setOpenColumnId] = useState(null);
  const [cardTitle, setCardTitle] = useState("");
  const [cardAuthor, setCardAuthor] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    })
  );

  // Fetch workspace on mount or when workspaceId changes
  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/workspaces/${workspaceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWorkspace(res.data.workspace);
      } catch (error) {
        console.error("Failed to fetch workspace:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (workspaceId) {
      fetchWorkspace();
    }
  }, [workspaceId]);

  // Listen for real-time workspace updates via socket
  useEffect(() => {
    if (!socket) return;

    socket.on("workspace-updated", (updatedWorkspace) => {
      if (updatedWorkspace._id === workspaceId) {
        setWorkspace(updatedWorkspace);
      }
    });

    return () => socket.off("workspace-updated");
  }, [socket, workspaceId]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || !workspace) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId === overId) return;

    let fromColumnId, fromIndex;
    let toColumnId, toIndex;

    // Parse active (source) ID - must be a card
    if (activeId.startsWith("card-")) {
      const parts = activeId.substring(5).split("-");
      fromIndex = parseInt(parts[parts.length - 1]);
      fromColumnId = parts.slice(0, -1).join("-");
    } else {
      return;
    }

    // Parse over (target) ID - can be a card OR a column
    if (overId.startsWith("card-")) {
      // Dropping on another card
      const parts = overId.substring(5).split("-");
      toIndex = parseInt(parts[parts.length - 1]);
      toColumnId = parts.slice(0, -1).join("-");
    } else if (overId.startsWith("column-")) {
      // Dropping on an empty column - add to the end
      toColumnId = overId.substring(7); // Remove "column-" prefix
      const targetColumn = workspace.columns.find(c => c.id === toColumnId);
      toIndex = targetColumn ? targetColumn.cards.length : 0;
    } else {
      return;
    }

    // Don't update if dragging within same position
    if (fromColumnId === toColumnId && fromIndex === toIndex) {
      return;
    }

    // Validate column IDs exist
    const fromColumnExists = workspace.columns?.some(c => c.id === fromColumnId);
    const toColumnExists = workspace.columns?.some(c => c.id === toColumnId);

    if (!fromColumnExists || !toColumnExists) {
      console.error(`Invalid column IDs: from=${fromColumnId}, to=${toColumnId}`);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const payload = { 
        fromColumnId, 
        toColumnId, 
        fromIndex, 
        toIndex 
      };

      console.log("Sending drag payload:", payload);

      const res = await axios.patch(
        `/api/workspaces/${workspace._id}/move-card`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWorkspace(res.data.workspace);

      if (socket) {
        socket.emit("card-moved", {
          workspaceId: workspace._id,
          workspace: res.data.workspace,
        });
      }
    } catch (error) {
      console.error("Failed to move card:", error);
      if (error.response?.data) {
        console.error("Server error response:", error.response.data);
      }
    }
  };

  const handleAddCard = async (columnId) => {
    if (!cardTitle.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `/api/workspaces/${workspace._id}/cards`,
        {
          columnId,
          bookId: `book-${Date.now()}`,
          title: cardTitle,
          author: cardAuthor,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWorkspace(res.data.workspace);
      setCardTitle("");
      setCardAuthor("");
      setOpenColumnId(null);

      if (socket) {
        socket.emit("card-added", {
          workspaceId: workspace._id,
          workspace: res.data.workspace,
        });
      }
    } catch (error) {
      console.error("Failed to add card:", error);
    }
  };

  const handleDeleteCard = async (columnId, cardId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(
        `/api/workspaces/${workspace._id}/cards`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { columnId, cardId },
        }
      );

      setWorkspace(res.data.workspace);

      if (socket) {
        socket.emit("card-deleted", {
          workspaceId: workspace._id,
          workspace: res.data.workspace,
        });
      }
    } catch (error) {
      console.error("Failed to delete card:", error);
    }
  };

  return (
    <div>
      {isLoading ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">Loading workspace...</p>
        </div>
      ) : workspace ? (
        <div>
          {/* Workspace Title and Description */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              {workspace.name}
            </h1>
            <p className="text-gray-400">
              {workspace.description || "No description"}
            </p>
          </div>

          {/* Debug info */}
          <div className="mb-4 text-xs text-gray-400">
            Workspace ID: {workspace._id} | Columns: {workspace.columns?.length || 0}
          </div>

          {/* Kanban Board with Drag & Drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
          >
            {/* Single SortableContext for all columns to allow cross-column dragging */}
            <SortableContext
              items={workspace.columns.flatMap((column) =>
                column.cards.map((_, idx) => `card-${column.id}-${idx}`)
              )}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-3 gap-6">
                {workspace.columns.map((column) => (
                  <div key={column.id} className="bg-gray-800 rounded-lg p-4 flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-white font-bold text-lg">{column.title}</h3>
                      <p className="text-gray-400 text-sm">
                        {column.cards.length} cards
                      </p>
                    </div>

                    <div className="flex-1 flex flex-col">
                      {column.cards.length === 0 ? (
                        <ColumnDropZone columnId={column.id} />
                      ) : (
                        <div className="space-y-3">
                          {column.cards.map((card, idx) => (
                            <DraggableCard
                              key={card.id}
                              id={`card-${column.id}-${idx}`}
                              card={card}
                              columnId={column.id}
                              onDelete={handleDeleteCard}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {openColumnId === column.id ? (
                      <div className="mt-4 space-y-2">
                        <input
                          type="text"
                          placeholder="Book title"
                          value={cardTitle}
                          onChange={(e) => setCardTitle(e.target.value)}
                          className="w-full p-2 bg-gray-700 text-white rounded text-sm border border-gray-600 focus:border-blue-500 outline-none"
                          autoFocus
                        />
                        <input
                          type="text"
                          placeholder="Author (optional)"
                          value={cardAuthor}
                          onChange={(e) => setCardAuthor(e.target.value)}
                          className="w-full p-2 bg-gray-700 text-white rounded text-sm border border-gray-600 focus:border-blue-500 outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddCard(column.id)}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded font-medium text-sm transition"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setOpenColumnId(null)}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded font-medium text-sm transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setOpenColumnId(column.id)}
                        className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white p-2 rounded font-medium text-sm transition"
                      >
                        + Add Card
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">Failed to load workspace</p>
        </div>
      )}
    </div>
  );
}
