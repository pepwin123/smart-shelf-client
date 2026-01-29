import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./components/Auth/login";
import Home from "./components/Home/home";
import { useEffect, useState } from "react";
import axios from "axios";
import Register from "./components/Auth/register";

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  console.log(user);

  useEffect(()=>{
    const fetchUser = async () =>{
      const token = localStorage.getItem("token");
      if(token){
        try{
          const res = await axios.get("/api/users/me", {
          headers:{ Authorization:`Bearer ${token}`},
        });
        setUser(res.data);
        }
        catch (err){
          localStorage.removeItem("token");
          console.log(err);
        }}
        setIsLoading(false);
    };
    fetchUser();
  }, []);

  if(isLoading){
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
  
      <Routes>
        <Route path="/" element={<LoginPage setUser={setUser}/>} />
        <Route path="/home" element={<Home user={user}/>}/>
        <Route path="/register" element={<Register setUser={setUser}/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
