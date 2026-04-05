import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser({ id: "user_123", role: "editor" }); // Mock user decoding for now
    } else {
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post("http://localhost:5000/auth/login", { email, password });
    setToken(res.data.token);
    localStorage.setItem("token", res.data.token);
  };

  // NEW: Add the register function
  const register = async (email, password) => {
    const res = await axios.post("http://localhost:5000/auth/register", { email, password });
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