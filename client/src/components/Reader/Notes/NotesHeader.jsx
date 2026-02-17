import { Plus } from "lucide-react";

export default function NotesHeader({ onAddClick }) {
  return (
    <div className="bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between shrink-0">
      <h2 className="text-lg font-bold text-white">Research Notes</h2>
      <button
        onClick={onAddClick}
        className="p-2 hover:bg-gray-700 rounded transition text-blue-400 hover:text-blue-300"
        title="Add new note"
      >
        <Plus size={20} />
      </button>
    </div>
  );
}
