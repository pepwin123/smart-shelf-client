import BookCard from "../Searchbar/bookCard";

export default function SearchResults({ books }) {
  if (!books.length) return null;

  return (
    <div className="mt-8 grid grid-cols-4 gap-6 max-w-3xl mx-auto">
      {books.map((book) => (
        <BookCard key={book.key} book={book} />
      ))}
    </div>
  );
}