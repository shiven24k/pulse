import { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        {/* If logged in, go to Dashboard. Otherwise, show Login */}
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        
        {/* Protect the Dashboard route */}
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
      </Routes>
    </Router>
    
  );
}

export default App;