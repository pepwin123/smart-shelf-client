import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2 } from "lucide-react";

export default function Card({ id, card, onDelete }) {
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
      className={`bg-gray-600 p-3 rounded shadow-lg hover:shadow-xl transition cursor-grab active:cursor-grabbing group flex flex-col ${
        isDragging ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <div className="flex-1 mb-2">
        <p className="text-white font-medium truncate text-sm">
          {card.title}
        </p>
        {card.author && (
          <p className="text-gray-300 text-xs truncate">{card.author}</p>
        )}
      </div>
      <div className="flex justify-end items-center gap-2 pt-2 border-t border-gray-500">
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100 shrink-0 p-1"
          title="Delete card"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
