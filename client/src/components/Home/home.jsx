import Header from "../Navbar/navbar";
import SearchBar from "../Searchbar/searchbar";
import SearchResults from "../Searchbar/searchResults";
import { useState } from "react";

export default function Home({setUser}) {
    const [books, setBooks] = useState([]);

    return (
        <div>
            <Header setUser={setUser} />
            <div className="min-h-screen bg-neutral-300">
                <SearchBar onResults={setBooks} />
                <SearchResults books={books} />
            </div>
        </div>
    )
}