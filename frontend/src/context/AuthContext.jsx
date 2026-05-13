import { createContext, useState, useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { API_URL } from "../config";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { getToken, signOut } = useAuth();
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const [appUser, setAppUser] = useState(null);
  const [token, setToken] = useState("");
  const [syncError, setSyncError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const syncedIdRef = useRef(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && clerkUser && clerkUser.id !== syncedIdRef.current) {
      syncedIdRef.current = clerkUser.id;
      syncWithBackend();
    } else if (!isSignedIn) {
      syncedIdRef.current = null;
      setAppUser(null);
      setToken("");
      setSyncError("");
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [isSignedIn, isLoaded, clerkUser?.id]);

  const syncWithBackend = async () => {
    setSyncing(true);
    setSyncError("");
    try {
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error("No session token from Clerk");

      const res = await axios.post(
        `${API_URL}/auth/sync`,
        {},
        { headers: { Authorization: `Bearer ${clerkToken}` } }
      );
      const { token: appToken, user } = res.data;
      setToken(appToken);
      setAppUser(user);
      axios.defaults.headers.common["Authorization"] = `Bearer ${appToken}`;
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || "Unknown error";
      console.error("[AuthContext] sync failed:", detail);
      setSyncError(detail);
      // Reset so user can retry after fixing the issue
      syncedIdRef.current = null;
    } finally {
      setSyncing(false);
    }
  };

  const logout = async () => {
    await signOut();
    syncedIdRef.current = null;
    setAppUser(null);
    setToken("");
    setSyncError("");
    delete axios.defaults.headers.common["Authorization"];
  };

  // isReady: Clerk loaded AND (not signed in OR sync finished — success or fail)
  const isReady = isLoaded && (!isSignedIn || appUser !== null || syncError !== "");

  return (
    <AuthContext.Provider value={{ user: appUser, token, logout, isReady, syncError, syncing, retrySync: syncWithBackend }}>
      {children}
    </AuthContext.Provider>
  );
};
