import { Trash2, Pin, Edit } from "lucide-react";
import ReactMarkdown from "react-markdown";
import NoteEditForm from "./NoteEditForm";

export default function NoteItem({ note, isSelected, onSelect, onDelete, onPin, onEditStart, onEditCancel, isEditing, editData, onEditChange, onEditSave, isSubmitting }) {
  return (
    <div
      onClick={() => onSelect(note._id)}
      className={`bg-gray-700 rounded p-3 cursor-pointer transition ${
        isSelected ? "ring-2 ring-blue-500" : ""
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
              onPin(note._id, note.pinned);
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
              onEditStart(note);
            }}
            className="p-1 text-gray-400 hover:text-gray-300 rounded transition"
            title="Edit note"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note._id);
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
      {isSelected && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          {isEditing ? (
            <NoteEditForm
              editData={editData}
              onEditChange={onEditChange}
              onSave={(e) => {
                e.stopPropagation();
                onEditSave(note._id);
              }}
              onCancel={(e) => {
                e.stopPropagation();
                onEditCancel();
              }}
              isSubmitting={isSubmitting}
            />
          ) : (
            <div className="prose prose-sm prose-invert max-w-none text-gray-300">
              <ReactMarkdown>{note.content}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
