export default function Filters({
  subject,
  setSubject,
  year,
  setYear,
  availability,
  setAvailability,
  onApply,
}) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <input
        type="number"
        placeholder="Year"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="border p-2 w-32 rounded"
      />

      <input
        type="text"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="border p-2 w-32 rounded"
      />

      <select
        value={availability}
        onChange={(e) => setAvailability(e.target.value)}
        className="border p-2 w-40 rounded"
      >
        <option value="">Availability</option>
        <option value="readable">Readable</option>
        <option value="borrowable">Borrowable</option>
      </select>

      <button
        onClick={onApply}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Apply Filters
      </button>
    </div>
  );
}
