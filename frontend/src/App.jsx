import { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthenticateWithRedirectCallback, useClerk } from "@clerk/clerk-react";
import { AuthContext } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function SyncErrorScreen({ error, onRetry, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-12 h-12 bg-red-950 border border-red-800 flex items-center justify-center mx-auto text-2xl">⚠</div>
        <div>
          <h2 className="text-white font-black text-xl mb-2">Backend sync failed</h2>
          <p className="text-slate-500 text-sm mb-1">Could not connect your account to the server.</p>
          <code className="text-red-400 text-xs break-all">{error}</code>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-3 font-bold text-sm transition-colors cursor-pointer"
          >
            Retry
          </button>
          <button
            onClick={onLogout}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 font-bold text-sm transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
        <p className="text-slate-600 text-xs">
          Make sure <code className="text-slate-400">CLERK_SECRET_KEY</code> is set in <code className="text-slate-400">backend/.env</code>
        </p>
      </div>
    </div>
  );
}

function App() {
  const { user, isReady, syncError, retrySync, logout } = useContext(AuthContext);

  // Show sync error with retry option instead of spinning forever
  if (syncError) {
    return <SyncErrorScreen error={syncError} onRetry={retrySync} onLogout={logout} />;
  }

  return (
    <Router>
      <Routes>
        {/* OAuth callback — must be reachable regardless of auth state */}
        <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />

        <Route
          path="/"
          element={!isReady ? <LoadingScreen /> : user ? <Navigate to="/dashboard" /> : <Landing />}
        />
        <Route
          path="/login"
          element={!isReady ? <LoadingScreen /> : user ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/dashboard"
          element={!isReady ? <LoadingScreen /> : user ? <Dashboard /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
