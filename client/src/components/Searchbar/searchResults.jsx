import BookCard from "../Searchbar/bookCard";

export default function SearchResults({ books, onBookAdded }) {
  if (!books.length) return null;

  return (
    <div className="mt-8 grid grid-cols-6 gap-6">
      {books.map((book) => (
        <BookCard key={book.key} book={book} onBookAdded={onBookAdded} />
      ))}
    </div>
  );
}