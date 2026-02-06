import BookCard from "../Searchbar/bookCard";

export default function SearchResults({ books, onBookAdded }) {
  if (!books.length) return null;

  return (
    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5 md:gap-6">
      {books.map((book) => (
        <BookCard key={book.key} book={book} onBookAdded={onBookAdded} />
      ))}
    </div>
  );
}