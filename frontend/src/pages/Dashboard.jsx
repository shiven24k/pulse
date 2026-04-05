import { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";
import axios from "axios";
import { 
  Upload, Play, Trash2, LogOut, ShieldCheck, 
  AlertCircle, Loader2, CheckCircle2, Film, Search, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import HlsVideoPlayer from "../components/HlsVideoPlayer";
import AdminPanel from "../components/AdminPanel"; // Ensure this import exists

export default function Dashboard() {
  const { logout, user } = useContext(AuthContext);
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [quality, setQuality] = useState("720p");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("library"); // Controls Admin view

  useEffect(() => {
    fetchVideos();
    const socket = io(import.meta.env.VITE_API_URL);
    if (user?.id) socket.emit("join_user_room", user.id);

    socket.on("video-progress", (data) => {
      setVideos((prev) =>
        prev.map((vid) =>
          vid._id === data.videoId ? { ...vid, progress: data.progress, status: data.status } : vid
        )
      );
      if (data.progress === 100 && data.status === "safe") fetchVideos();
    });

    return () => socket.disconnect();
  }, [user]);

 const fetchVideos = async () => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/videos`);
    setVideos(res.data);
  } catch (err) { 
    // Don't show the error toast if the user is just a viewer 
    // who isn't authorized to see the editor-level list
    if (user?.role !== "viewer") {
      setError(err.response?.data?.error || "Fetch error");
    }
  }
};

  const filteredVideos = useMemo(() => {
    return videos.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [videos, searchQuery]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    const formData = new FormData();
    formData.append("video", file);
    setUploading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/videos`, formData);
      setVideos([res.data, ...videos]);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed.");
    } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanent delete? This saves server space.")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/videos/${id}`);
      setVideos(videos.filter((v) => v._id !== id));
      if (selectedVideo?._id === id) setSelectedVideo(null);
    } catch (err) { alert("Delete failed. Admins only."); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-20">
      {/* 1. HEADER */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200 text-white">
            <ShieldCheck size={24} />
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {/* TAB SWITCHER (Admin Only) */}
          {user?.role === "admin" && (
            <div className="flex bg-slate-100 p-1 rounded-xl hidden md:flex">
              <button onClick={() => setActiveTab("library")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'library' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Library</button>
              <button onClick={() => setActiveTab("admin")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'admin' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Users</button>
            </div>
          )}

          <div className="text-right">
            <p className="text-sm font-bold text-slate-800 leading-none">{user?.email?.split('@')[0]}</p>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{user?.role}</span>
          </div>
          <button onClick={logout} className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-all cursor-pointer"><LogOut size={20} /></button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8 space-y-10">
        
        {activeTab === "library" ? (
          <div className="space-y-10">
            {/* 2. UPLOAD HERO (Restricted to Editor/Admin) */}
{user?.role !== "viewer" && activeTab === "library" && (
    <motion.section 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-8"
    >
      <div className="max-w-md">
        <h2 className="text-3xl font-extrabold tracking-tight mb-2">Stream Securely.</h2>
        <p className="text-slate-500 text-lg">AI-driven moderation meets high-fidelity HLS delivery.</p>
      </div>

      <label className={`group relative flex items-center gap-4 px-10 py-5 rounded-2xl cursor-pointer transition-all active:scale-95 ${
        uploading ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-2xl shadow-indigo-100'
      }`}>
        {uploading ? <Loader2 className="animate-spin" /> : <Upload size={22} />}
        <span className="font-bold text-lg">{uploading ? "Analyzing..." : "Post New Video"}</span>
        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept="video/*" />
      </label>
    </motion.section>
  )}

            <AnimatePresence>
              {error && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                  className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3">
                  <AlertCircle size={20} /> <span className="font-medium text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PLAYER SECTION */}
            <AnimatePresence mode="wait">
              {selectedVideo && (
                <motion.section initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-950 rounded-[3rem] overflow-hidden shadow-3xl shadow-indigo-900/20 border border-white/5">
                  <div className="p-8 flex justify-between items-center text-white/90">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] mb-1 block">Active Stream</span>
                      <h3 className="text-xl font-bold">{selectedVideo.title}</h3>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl">
                      {['480p', '720p', '1080p'].map((q) => (
                        <button key={q} onClick={() => setQuality(q)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          quality === q ? 'bg-white text-slate-950 shadow-lg' : 'hover:bg-white/10 text-white/40'
                        }`}>{q}</button>
                      ))}
                    </div>
                  </div>
                  <HlsVideoPlayer src={`${import.meta.env.VITE_API_URL}/${selectedVideo.qualities[quality]}`} />
                </motion.section>
              )}
            </AnimatePresence>

            {/* FEED SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Film size={14} /> Library Feed
                </h4>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                </div>
              </div>

              <div className="grid gap-3">
                {filteredVideos.map((vid) => (
                  <motion.div layout key={vid._id} className="group bg-white p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-5 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${vid.status === 'safe' ? 'bg-emerald-50 text-emerald-500' : vid.status === 'flagged' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'}`}>
                        {vid.status === 'safe' ? <CheckCircle2 size={20} /> : vid.status === 'flagged' ? <AlertCircle size={20} /> : <Loader2 className="animate-spin" size={20} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 leading-tight">{vid.title}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{vid.status}</span>
                          {vid.progress < 100 && vid.status !== "flagged" && (
                            <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div className="h-full bg-indigo-500" initial={{ width: 0 }} animate={{ width: `${vid.progress}%` }} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {vid.status === "safe" && (
                        <button onClick={() => setSelectedVideo(vid)} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer">Watch</button>
                      )}
                      {user?.role === "admin" && (
                        <button onClick={() => handleDelete(vid._id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"><Trash2 size={18} /></button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <AdminPanel />
        )}
      </main>
    </div>
  );
}