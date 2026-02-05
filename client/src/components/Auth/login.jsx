import React from "react"
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


export default function LoginPage({setUser}) {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    // Validation rules
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) return "Email is required";
        if (!emailRegex.test(email)) return "Please enter a valid email";
        return "";
    };

    const validatePassword = (password) => {
        if (!password) return "Password is required";
        if (password.length < 6) return "Password must be at least 6 characters";
        return "";
    };

    const handleChange = (e) =>{
        const {name, value} = e.target;
        setFormData({...formData, [name]: value});
        // Clear error for this field on change
        if (errors[name]) {
            setErrors({...errors, [name]: ""});
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Validate all fields
        const newErrors = {};
        const emailError = validateEmail(formData.email);
        const passwordError = validatePassword(formData.password);
        
        if (emailError) newErrors.email = emailError;
        if (passwordError) newErrors.password = passwordError;
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await axios.post("/api/users/login", formData);
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            console.log(res.data)
            setUser(res.data.user);
            console.log("login successful", res.data);
            navigate('/home');
        } catch (error) {
            setError(error.response?.data?.message || "Login failed")
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-200">
                    <h2 className="text-2xl font-bold mb-10 text-center text-gray-800">Welcome to Login Page!!!</h2>
                    {error && <p className="text-red-500 mb-4 text-sm bg-red-50 p-3 rounded">{error}</p>}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-600 text-sm font-medium mb-1">Email</label>
                            <input 
                                type="email" 
                                placeholder="Enter your email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                className={`w-full p-3 border rounded-md focus:ring-2 outline-none mb-1 ${errors.email ? 'border-red-500 focus:ring-red-200 focus:border-red-400' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'}`}
                            />
                            {errors.email && <p className="text-red-500 text-xs mb-3">{errors.email}</p>}
                            
                            <label className="block text-gray-600 text-sm font-medium mb-1">Password</label>
                            <input 
                                type="password" 
                                placeholder="Enter your password" 
                                name="password" 
                                value={formData.password} 
                                onChange={handleChange} 
                                className={`w-full p-3 border rounded-md focus:ring-2 outline-none mb-1 ${errors.password ? 'border-red-500 focus:ring-red-200 focus:border-red-400' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'}`}
                            />
                            {errors.password && <p className="text-red-500 text-xs mb-3">{errors.password}</p>}
                        </div>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full text-white bg-blue-500 p-3 rounded-md hover:bg-blue-600 font-medium cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Logging in..." : "Login"}
                        </button>
                        <div className="mt-5 flex place-content-between">
                            <span className="font-medium">Don't have account?</span>
                            <button 
                                type="button"
                                className="font-medium cursor-pointer text-blue-500 hover:text-blue-700" 
                                onClick={()=>{navigate("/register")}}
                            >
                                Sign Up
                            </button> 
                        </div>
                    </form>
            </div> 
        </div>
    )
}