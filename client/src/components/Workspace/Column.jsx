import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Card from "./Card";

export default function Column({ column, onAddCard, onDeleteCard }) {
  const { setNodeRef } = useDroppable({
    id: `column-${column.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className="bg-gray-800 rounded-lg p-4 min-h-screen flex flex-col"
    >
      <div className="mb-4">
        <h3 className="text-white font-bold text-lg">{column.title}</h3>
        <p className="text-gray-400 text-sm">{column.cards.length} cards</p>
      </div>

      <SortableContext
        items={column.cards.map((card, idx) => `${column.id}-${idx}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 flex-1">
          {column.cards.map((card, idx) => (
            <Card
              key={card.id}
              id={`${column.id}-${idx}`}
              card={card}
              columnId={column.id}
              onDelete={() => onDeleteCard(column.id, card.id)}
            />
          ))}
        </div>
      </SortableContext>

      <button
        onClick={() => onAddCard(column.id)}
        className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white p-2 rounded font-medium text-sm transition"
      >
        + Add Card
      </button>
    </div>
  );
}
