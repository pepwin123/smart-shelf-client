import Header from "../Navbar/navbar";
import SearchBar from "../Searchbar/searchbar";
import SearchResults from "../Searchbar/searchResults";
import { useState } from "react";

export default function Home() {
    const [books, setBooks] = useState([]);

    return (
        <div>
            <Header />
            <div className="min-h-screen">
                <SearchBar onResults={setBooks} />
                <SearchResults books={books} />
            </div>
        </div>
    )
}