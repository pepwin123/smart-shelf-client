export default function BookCard({ book }) {
  return (
  
         <div className="bg-slate-800 text-white p-4 rounded-lg relative top-50">
      <h3 className="text-lg font-semibold">{book.title}</h3>

      <p className="text-sm text-gray-300">
        Author: {book.author_name?.join(", ") || "Unknown"}
      </p>

      <p className="text-sm text-gray-400">
        First Published: {book.first_publish_year || "N/A"}
      </p>

      {book.cover_i && (
        <img
          className="mt-2 w-24 rounded"
          src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
          alt={book.title}
        />
      )}
    </div>
   
  );
}
