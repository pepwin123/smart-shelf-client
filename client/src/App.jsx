import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/Auth/login";
import Home from "./components/Home/home";
import Register from "./components/Auth/register";
import Workspace from "./components/Workspace/Workspace";
import Reader from "./components/Reader/Reader";

import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await axios.get("/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data);
        } catch (err) {
          localStorage.removeItem("token");
          console.log(err);
        }
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={!user ? <LoginPage setUser={setUser} /> : <Navigate to="/home" />}
        />
        <Route
          path="/register"
          element={!user ? <Register setUser={setUser} /> : <Navigate to="/home" />}
        />
        <Route
          path="/home"
          element={user ? <Home user={user} setUser={setUser} /> : <Navigate to="/" />}
        />
        <Route
          path="/workspace"
          element={user ? <Workspace user={user} setUser={setUser} /> : <Navigate to="/" />}
        />
        <Route
          path="/reader/:bookId"
          element={user ? <Reader user={user} /> : <Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
