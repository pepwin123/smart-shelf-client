import React from "react"
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


export default function Register({setUser}) {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmpassword: "",
    });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    // Validation rules
    const validateUsername = (username) => {
        if (!username) return "Username is required";
        if (username.length < 3) return "Username must be at least 3 characters";
        if (username.length > 20) return "Username must be at most 20 characters";
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) return "Username can only contain letters, numbers, hyphens, and underscores";
        return "";
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) return "Email is required";
        if (!emailRegex.test(email)) return "Please enter a valid email";
        return "";
    };

    const validatePassword = (password) => {
        if (!password) return "Password is required";
        if (password.length < 6) return "Password must be at least 6 characters";
        if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
        if (!/[0-9]/.test(password)) return "Password must contain at least one number";
        return "";
    };

    const validateConfirmPassword = (password, confirmPassword) => {
        if (!confirmPassword) return "Please confirm your password";
        if (password !== confirmPassword) return "Passwords do not match";
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
        const usernameError = validateUsername(formData.username);
        const emailError = validateEmail(formData.email);
        const passwordError = validatePassword(formData.password);
        const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmpassword);
        
        if (usernameError) newErrors.username = usernameError;
        if (emailError) newErrors.email = emailError;
        if (passwordError) newErrors.password = passwordError;
        if (confirmPasswordError) newErrors.confirmpassword = confirmPasswordError;
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await axios.post("/api/users/register", formData);
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            console.log(res.data)
            setUser(res.data.user);
            console.log("Registration successful", res.data);
            navigate('/home');
        } catch (error) {
            setError(error.response?.data?.message || "Registration failed")
        } finally {
            setIsSubmitting(false);
        }
    };
 
    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-200">
                    <h2 className="text-2xl font-bold mb-10 text-center text-gray-800">Welcome to Register Page!!!</h2>
                    {error && <p className="text-red-500 mb-4 text-sm bg-red-50 p-3 rounded">{error}</p>}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-600 text-sm font-medium mb-1">Username</label>
                            <input 
                                type="text" 
                                name="username" 
                                value={formData.username} 
                                onChange={handleChange} 
                                placeholder="Enter your username" 
                                className={`w-full p-3 border rounded-md focus:ring-2 outline-none mb-1 ${errors.username ? 'border-red-500 focus:ring-red-200 focus:border-red-400' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'}`}
                            />
                            {errors.username && <p className="text-red-500 text-xs mb-3">{errors.username}</p>}
                            
                            <label className="block text-gray-600 text-sm font-medium mb-1">Email</label>
                            <input 
                                type="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                placeholder="Enter your email" 
                                className={`w-full p-3 border rounded-md focus:ring-2 outline-none mb-1 ${errors.email ? 'border-red-500 focus:ring-red-200 focus:border-red-400' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'}`}
                                autoComplete="off"
                            />
                            {errors.email && <p className="text-red-500 text-xs mb-3">{errors.email}</p>}
                            
                            <label className="block text-gray-600 text-sm font-medium mb-1">Password</label>
                            <input 
                                type="password"
                                name="password" 
                                value={formData.password} 
                                onChange={handleChange} 
                                placeholder="Enter your password" 
                                className={`w-full p-3 border rounded-md focus:ring-2 outline-none mb-1 ${errors.password ? 'border-red-500 focus:ring-red-200 focus:border-red-400' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'}`}
                            />
                            {errors.password && <p className="text-red-500 text-xs mb-3">{errors.password}</p>}
                            <p className="text-gray-500 text-xs mb-3">Must be at least 6 characters with 1 uppercase letter and 1 number</p>
                            
                            <label className="block text-gray-600 text-sm font-medium mb-1">Confirm Password</label>
                            <input 
                                type="password"
                                name="confirmpassword" 
                                value={formData.confirmpassword} 
                                onChange={handleChange} 
                                placeholder="Confirm your password" 
                                className={`w-full p-3 border rounded-md focus:ring-2 outline-none mb-1 ${errors.confirmpassword ? 'border-red-500 focus:ring-red-200 focus:border-red-400' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'}`}
                            />
                            {errors.confirmpassword && <p className="text-red-500 text-xs mb-3">{errors.confirmpassword}</p>}
                        </div>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 font-medium cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Registering..." : "Sign Up"}
                        </button>
                        <div className="mt-5 flex items-center justify-between">
                            <span className="font-medium">Already have an account?</span>
                            <button 
                                type="button"
                                className="font-medium text-blue-500 hover:text-blue-700"
                                onClick={() => { navigate('/login'); }}
                            >
                                Login
                            </button>
                        </div>
                    </form>
            </div> 
        </div>
    )
}