import { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";
import axios from "axios";
import {
  Upload, Trash2, LogOut,
  AlertCircle, Loader2, CheckCircle2, Film, Search, XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import HlsVideoPlayer from "../components/HlsVideoPlayer";
import AdminPanel from "../components/AdminPanel";
import { API_URL } from "../config";

const PHASE_LABELS = {
  extracting_frames: "Extracting frames…",
  nsfw_check:        "NSFW.js · frame",
  clarifai_check:    "Clarifai · frame",
  uploading:         "Uploading to cloud…",
  finalizing:        "Generating HLS streams…",
};

function phaseLabel(vid) {
  if (!vid._phase) return vid.status;
  const base = PHASE_LABELS[vid._phase] ?? vid._phase;
  if (vid._frame && vid._totalFrames && vid._phase.endsWith("_check")) {
    return `${base} ${vid._frame}/${vid._totalFrames}`;
  }
  return base;
}

export default function Dashboard() {
  const { logout, user } = useContext(AuthContext);
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("library");

  useEffect(() => {
    fetchVideos();

    const socket = io(API_URL, {
      withCredentials: true,
      transports: ["polling", "websocket"],
    });

    if (user?.id) socket.emit("join_user_room", user.id);

    socket.on("video-progress", (data) => {
      setVideos((prev) =>
        prev.map((vid) =>
          vid._id === data.videoId
            ? {
                ...vid,
                progress:     data.progress,
                status:       data.status,
                flagReason:   data.flagReason,
                // Live pipeline metadata (not stored in DB)
                _phase:       data.phase,
                _frame:       data.frame,
                _totalFrames: data.totalFrames,
                _apis:        data.apis,
              }
            : vid
        )
      );
      if (data.status === "safe") fetchVideos();
    });

    return () => socket.disconnect();
  }, [user]);

  const fetchVideos = async () => {
    try {
      const res = await axios.get(`${API_URL}/videos`);
      setVideos(res.data);
    } catch (err) {
      if (user?.role !== "viewer") setError(err.response?.data?.error || "Fetch error");
    }
  };

  const filteredVideos = useMemo(
    () => videos.filter((v) => v.title.toLowerCase().includes(searchQuery.toLowerCase())),
    [videos, searchQuery]
  );

  const stats = useMemo(() => ({
    total:      videos.length,
    safe:       videos.filter((v) => v.status === "safe").length,
    flagged:    videos.filter((v) => v.status === "flagged").length,
    failed:     videos.filter((v) => v.status === "failed").length,
    processing: videos.filter((v) => !["safe", "flagged", "failed"].includes(v.status)).length,
  }), [videos]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side 500 MB guard
    if (file.size > 500 * 1024 * 1024) {
      setError("File too large. Maximum size is 500 MB.");
      e.target.value = "";
      return;
    }

    setError("");
    const formData = new FormData();
    formData.append("video", file);
    setUploading(true);
    try {
      const res = await axios.post(`${API_URL}/videos`, formData);
      setVideos((prev) => [res.data, ...prev]);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this video?")) return;
    try {
      await axios.delete(`${API_URL}/videos/${id}`);
      setVideos((prev) => prev.filter((v) => v._id !== id));
      if (selectedVideo?._id === id) setSelectedVideo(null);
    } catch {
      alert("Delete failed. Admins only.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-5">
          <div className="-skew-x-6 bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-1.5 inline-block shadow-lg shadow-violet-200">
            <span className="skew-x-6 inline-block font-black italic text-white tracking-tight text-lg">VIGIL</span>
          </div>
          {user?.role === "admin" && (
            <div className="hidden md:flex bg-slate-100 p-1">
              {["library", "admin"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-xs font-bold capitalize transition-all ${
                    activeTab === tab ? "bg-white shadow-sm text-violet-600" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab === "admin" ? "Users" : "Library"}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800 leading-none">{user?.email?.split("@")[0]}</p>
            <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest">{user?.role}</span>
          </div>
          <button onClick={logout} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all cursor-pointer" title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 pt-8 space-y-8">
        {activeTab === "library" ? (
          <div className="space-y-8">

            {/* ── STATS ── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Total",      value: stats.total,      icon: <Film size={16} />,                                         color: "violet"  },
                { label: "Safe",       value: stats.safe,       icon: <CheckCircle2 size={16} />,                                 color: "emerald" },
                { label: "Flagged",    value: stats.flagged,    icon: <AlertCircle size={16} />,                                  color: "red"     },
                { label: "Failed",     value: stats.failed,     icon: <XCircle size={16} />,                                      color: "orange"  },
                { label: "Processing", value: stats.processing, icon: <Loader2 size={16} className={stats.processing > 0 ? "animate-spin" : ""} />, color: "amber" },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-slate-100 p-5 shadow-sm">
                  <div className={`w-8 h-8 flex items-center justify-center mb-3 ${
                    s.color === "violet"  ? "bg-violet-50 text-violet-500"   :
                    s.color === "emerald" ? "bg-emerald-50 text-emerald-500" :
                    s.color === "red"     ? "bg-red-50 text-red-500"         :
                    s.color === "orange"  ? "bg-orange-50 text-orange-500"   :
                                           "bg-amber-50 text-amber-500"
                  }`}>
                    {s.icon}
                  </div>
                  <p className="text-2xl font-black text-slate-900">{s.value}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* ── UPLOAD HERO ── */}
            {user?.role !== "viewer" && (
              <motion.section
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-100 shadow-sm p-8 flex flex-col md:flex-row items-center justify-between gap-8"
              >
                <div>
                  <h2 className="text-2xl font-black tracking-tight mb-1">Upload a Video</h2>
                  <p className="text-slate-500 text-sm">
                    Dual AI moderation — NSFW.js always runs, Clarifai when configured.
                  </p>
                  <div className="flex items-center gap-4 mt-4 flex-wrap">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-violet-400 inline-block" /> NSFW.js
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-indigo-400 inline-block" /> Clarifai (optional)
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 inline-block" /> HLS Delivery
                    </span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Max 500 MB
                    </span>
                  </div>
                </div>

                <label className={`flex items-center gap-3 px-8 py-4 font-bold cursor-pointer transition-all active:scale-95 ${
                  uploading ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-900 text-white hover:bg-violet-600 shadow-lg shadow-slate-200"
                }`}>
                  {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                  <span>{uploading ? "Uploading…" : "Post New Video"}</span>
                  <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept="video/*" />
                </label>
              </motion.section>
            )}

            {/* ── ERROR ── */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }}
                  className="bg-red-50 border border-red-100 text-red-600 p-4 flex items-center gap-3"
                >
                  <AlertCircle size={18} />
                  <span className="font-medium text-sm">{error}</span>
                  <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600 cursor-pointer">✕</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── VIDEO PLAYER ── */}
            <AnimatePresence mode="wait">
              {selectedVideo && (
                <motion.section
                  key={selectedVideo._id}
                  initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                  className="bg-black overflow-hidden border border-white/5 shadow-2xl shadow-slate-900/20"
                >
                  <div className="px-6 py-4 bg-slate-950 flex justify-between items-center text-white/90 border-b border-white/5">
                    <div className="min-w-0 mr-4">
                      <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.3em] mb-0.5 block">Now Playing</span>
                      <h3 className="text-sm font-bold truncate">{selectedVideo.title}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedVideo(null)}
                      className="p-2 flex-shrink-0 hover:bg-white/10 text-white/40 hover:text-white transition-all cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <HlsVideoPlayer qualities={selectedVideo.qualities} />
                </motion.section>
              )}
            </AnimatePresence>

            {/* ── LIBRARY FEED ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Film size={12} /> Library Feed
                </h4>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text" placeholder="Search videos…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-56 pl-9 pr-4 py-2 bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {filteredVideos.length === 0 && (
                  <div className="text-center py-20 bg-white border border-slate-100">
                    <Film size={40} className="mx-auto mb-4 text-slate-200" />
                    <p className="font-bold text-slate-600 mb-1">
                      {searchQuery ? "No videos match your search" : "No videos yet"}
                    </p>
                    <p className="text-sm text-slate-400">
                      {searchQuery ? "Try a different search term." : user?.role !== "viewer" ? "Upload a video to start the AI moderation pipeline." : "Check back when content is available."}
                    </p>
                  </div>
                )}

                {filteredVideos.map((vid) => {
                  const isFailed  = vid.status === "failed";
                  const isFlagged = vid.status === "flagged";
                  const isSafe    = vid.status === "safe";
                  const isRunning = !isSafe && !isFlagged && !isFailed;

                  // Which APIs are (or were) in use — from live socket data or derive from status
                  const apis = vid._apis;

                  return (
                    <motion.div layout key={vid._id}
                      className="group bg-white border border-slate-100 hover:border-violet-200 p-5 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-5 flex-1">

                        {/* Status icon */}
                        <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${
                          isSafe    ? "bg-emerald-50 text-emerald-500" :
                          isFlagged ? "bg-red-50 text-red-500"         :
                          isFailed  ? "bg-orange-50 text-orange-500"   :
                                      "bg-violet-50 text-violet-500"
                        }`}>
                          {isSafe    ? <CheckCircle2 size={18} /> :
                           isFlagged ? <AlertCircle  size={18} /> :
                           isFailed  ? <XCircle      size={18} /> :
                                       <Loader2 className="animate-spin" size={18} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 leading-tight truncate">{vid.title}</p>

                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {/* Status badge */}
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                              isFlagged ? "text-red-400"     :
                              isSafe    ? "text-emerald-500" :
                              isFailed  ? "text-orange-500"  :
                                          "text-violet-400"
                            }`}>
                              {isFailed ? "Upload Failed" : vid.status}
                            </span>

                            {/* Flag / error reason */}
                            {(isFlagged || isFailed) && vid.flagReason && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 border ${
                                isFlagged ? "text-red-400 bg-red-50 border-red-100" : "text-orange-500 bg-orange-50 border-orange-100"
                              }`}>
                                {vid.flagReason}
                              </span>
                            )}

                            {/* Live progress bar + phase label */}
                            {isRunning && (
                              <div className="flex items-center gap-2">
                                <div className="w-28 h-1 bg-slate-100 overflow-hidden">
                                  <motion.div className="h-full bg-violet-500" initial={{ width: 0 }} animate={{ width: `${vid.progress}%` }} />
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">{vid.progress}%</span>
                              </div>
                            )}

                            {/* Live phase label for non-analysis phases */}
                            {isRunning && vid._phase && !["nsfw_check","clarifai_check"].includes(vid._phase) && (
                              <span className="text-[10px] font-bold text-violet-500 bg-violet-50 px-2 py-0.5 border border-violet-100">
                                {phaseLabel(vid)}
                              </span>
                            )}
                          </div>

                          {/* ── Live API status rows — visible for the whole pipeline run ── */}
                          {isRunning && apis && (
                            <div className="mt-2 space-y-1">
                              {/* NSFW.js */}
                              {(() => {
                                const active = vid._phase === "nsfw_check";
                                const done   = ["clarifai_check","uploading","finalizing"].includes(vid._phase);
                                return (
                                  <div className="flex items-center gap-2">
                                    {active ? <Loader2 size={11} className="animate-spin text-violet-500 flex-shrink-0" />
                                            : done ? <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                                            : <div className="w-[11px] h-[11px] rounded-full border border-slate-200 flex-shrink-0" />}
                                    <span className="text-[11px] font-semibold text-slate-700">
                                      NSFW.js {active ? `— scanning frame ${vid._frame ?? "…"}/${vid._totalFrames ?? "…"}` : done ? "— done" : "— pending"}
                                    </span>
                                  </div>
                                );
                              })()}

                              {/* Clarifai */}
                              {(() => {
                                const configured = apis.clarifai;
                                const active     = vid._phase === "clarifai_check";
                                const done       = configured && ["uploading","finalizing"].includes(vid._phase);
                                return (
                                  <div className="flex items-center gap-2">
                                    {!configured
                                      ? <XCircle size={11} className="text-red-400 flex-shrink-0" />
                                      : active ? <Loader2 size={11} className="animate-spin text-indigo-500 flex-shrink-0" />
                                      : done    ? <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                                      : <div className="w-[11px] h-[11px] rounded-full border border-slate-200 flex-shrink-0" />}
                                    <span className={`text-[11px] font-semibold ${!configured ? "text-red-400" : "text-slate-700"}`}>
                                      Clarifai {!configured ? "— unavailable, skipped"
                                              : active      ? `— scanning frame ${vid._frame ?? "…"}/${vid._totalFrames ?? "…"}`
                                              : done        ? "— done"
                                              :               "— waiting"}
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isSafe && (
                          <button onClick={() => setSelectedVideo(vid)} className="px-5 py-2 bg-slate-900 text-white font-bold text-xs hover:bg-violet-600 transition-all cursor-pointer shadow-sm">
                            Watch
                          </button>
                        )}
                        {user?.role === "admin" && (
                          <button onClick={() => handleDelete(vid._id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
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
