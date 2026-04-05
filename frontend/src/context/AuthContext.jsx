import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");

 // ✅ CHANGE IT TO THIS:
useEffect(() => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    
    try {
      // 1. Get the payload from the JWT string
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      // 2. Set the user state based on what the BACKEND actually said
      setUser({ 
        id: payload.id, 
        role: payload.role, 
        email: payload.email 
      });
    } catch (error) {
      console.error("Token decode failed", error);
      logout();
    }
  } else {
    setUser(null);
  }
}, [token]);

  const login = async (email, password) => {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, { email, password });
    setToken(res.data.token);
    localStorage.setItem("token", res.data.token);
  };

  // NEW: Add the register function
  const register = async (email, password) => {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, { email, password });
    setToken(res.data.token);
    localStorage.setItem("token", res.data.token);
  };

  const logout = () => {
    setToken("");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};