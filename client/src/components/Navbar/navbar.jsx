import React from "react"
import { Link, useNavigate } from "react-router-dom"
import { useState, useRef, useEffect } from "react";
import { Menu, X } from "lucide-react";
import profile from "../../assets/user.png"
import downarrow from "../../assets/down-arrow.png"

export default function Header({setUser}) {
    const username = JSON.parse(localStorage.getItem("user") || "{}");
    const [open, setOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        <nav className="bg-gray-800 shadow-lg fixed top-0 left-0 w-full z-50">
            <div className="flex items-center justify-between py-3 px-4 sm:px-6 md:px-8 lg:px-10">
                {/* Logo */}
                <Link to='/home' className="text-white text-lg sm:text-xl md:text-2xl font-semibold flex items-center whitespace-nowrap">
                    Smart Shelf
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center px-15 gap-3 lg:gap-5">
                    <Link to="/" className="py-1 px-2 lg:px-3 text-sm lg:text-lg font-light text-white rounded-xl hover:bg-slate-700 transition duration-300 whitespace-nowrap">
                        Discovery Engine
                    </Link>
                    <Link to="/workspace" className="py-1 px-2 lg:px-3 text-sm lg:text-lg font-light text-white rounded-xl hover:bg-slate-700 transition duration-300 whitespace-nowrap">
                        Workspace
                    </Link>
                </div>

                {/* Profile Section - Desktop */}
                <div
                    ref={dropdownRef}
                    className="hidden md:flex items-center gap-2 lg:gap-3 relative cursor-pointer ml-auto"
                >
                    <img src={profile} className="w-8 lg:w-9 rounded-full" alt="Profile" />
                    <p className="text-white font-bold text-sm lg:text-base truncate max-w-xs">
                        {username?.username || username?.email || "User"}
                    </p>
                    <img
                        src={downarrow}
                        className="w-3 lg:w-4 invert brightness-200 cursor-pointer"
                        onClick={() => setOpen(!open)}
                        alt="Dropdown"
                    />
                    {/* Dropdown */}
                    {open && (
                        <div className="absolute right-0 top-12 bg-blue-500 text-white rounded shadow-md w-24 lg:w-32">
                            <ul>
                                <li
                                    onClick={handleLogout}
                                    className="px-3 lg:px-4 py-2 hover:bg-gray-600 rounded cursor-pointer text-sm lg:text-base"
                                >
                                    Logout
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden ml-auto text-white p-1"
                    title="Toggle menu"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-gray-700 px-4 py-3 space-y-2">
                    <Link 
                        to="/" 
                        className="block py-2 px-3 text-white rounded-lg hover:bg-slate-600 transition duration-300"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Discovery Engine
                    </Link>
                    <Link 
                        to="/workspace" 
                        className="block py-2 px-3 text-white rounded-lg hover:bg-slate-600 transition duration-300"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Workspace
                    </Link>
                    <div className="border-t border-gray-600 pt-2 mt-2 flex items-center gap-2 px-2">
                        <img src={profile} className="w-7 rounded-full" alt="Profile" />
                        <div className="flex-1">
                            <p className="text-white text-sm font-bold truncate">
                                {username?.username || username?.email || "User"}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded transition duration-300"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </nav>
    )
}