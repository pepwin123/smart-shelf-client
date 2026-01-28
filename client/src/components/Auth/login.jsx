import React from "react"
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


export default function LoginPage({setUser}) {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) =>{
        setFormData({...formData, [e.target.name]: e.target.value})
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("/api/users/login", formData);
            localStorage.setItem("token", res.data.token);
            setUser(res.data.user);
            console.log("login successful", res.data);
            navigate('/home');
        } catch (error) {
            setError(error.response?.data?.message || "Login failed")
        }
    };
 
    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-200">
                    <h2 className="text-2xl font-bold mb-10 text-center text-gray-800">Welcome to Login Page!!!</h2>
                    {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-600 text-sm font-medium mb-1">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 outline-none focus:border-blue-400 mb-3" required/>
                            <label className="block text-gray-600 text-sm font-medium mb-1">Password</label>
                            <input type="password"name="password" value={formData.password} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 outline-none focus:border-blue-400 mb-3" required/>
                        </div>
                        <button className="w-full bg-blue-500 p-3 rounded-md hover:bg-blue-600 font-medium cursor-pointer">Login</button>
                    </form>
            </div> 
        </div>
    )
}