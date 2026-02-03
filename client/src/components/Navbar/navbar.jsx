import React from "react"
import { Link, useNavigate } from "react-router-dom"
import { useState, useRef, useEffect } from "react";
import profile from "../../assets/user.png"
import downarrow from "../../assets/down-arrow.png"

export default function Header({setUser}) {
    const username = JSON.parse(localStorage.getItem("user") || "{}");
    console.log(username);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/");
    };
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
            {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    return(
        <nav className="bg-gray-800 shadow-lg flex items-center justify-around py-4 px-32 fixed top-0 left-0 w-full gap-15">
            <Link to='/home' className="text-white text-2xl font-semibold flex items-center">Smart Shelf</Link>

            <div className="flex items-center gap-5 text-black">
                <Link to="/" className="py-1 px-3 text-lg font-light text-white rounded-xl hover:bg-slate-700 transition duration-300">Discovery Engine</Link>
                <Link to="/workspace" className="py-1 px-3 text-lg font-light text-white rounded-xl hover:bg-slate-700 transition duration-300">Collabrative Workspace</Link>
                <Link to="/" className="py-1 px-3 text-lg font-light text-white rounded-xl hover:bg-slate-700 transition duration-300">Research Notes</Link>
            </div>

            <div
                ref={dropdownRef}
                className="ml-auto flex items-center left-15 gap-3 relative cursor-pointer"
            >
                <img src={profile} className="w-9 rounded-full" />
                <p className="text-white font-bold">{username?.name}</p>
                <img
                    src={downarrow}
                    className="w-4 invert brightness-200"
                    onClick={() => setOpen(!open)}
                />
                {/* Dropdown */}
                {open && (
                    <div className="absolute right-0 top-14 bg-blue-500 text-white rounded shadow-md w-25">
                        <ul>
                            <li
                                onClick={handleLogout}
                                className="px-4 py-2 hover:bg-gray-600 rounded cursor-pointer"
                            >
                                Logout
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </nav>
    )
}