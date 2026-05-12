import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, AlertCircle, Loader2, UserPlus, LogIn, ArrowLeft } from "lucide-react";

export default function Login() {
  const { login, register } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Authentication failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-600 p-14 relative overflow-hidden">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative">
          <div className="-skew-x-6 bg-white/20 px-4 py-1.5 inline-block backdrop-blur-sm">
            <span className="skew-x-6 inline-block font-black italic text-white tracking-tight text-xl">VIGIL</span>
          </div>
        </div>

        <div className="relative space-y-10">
          <div>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              AI-powered content safety for every upload.
            </h2>
            <p className="text-violet-200 text-base leading-relaxed">
              Every video goes through dual AI moderation before a single viewer can access it.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { label: "Dual AI models", sub: "NSFW.js + Clarifai run in parallel" },
              { label: "Adaptive HLS streaming", sub: "480p · 720p · 1080p via Cloudinary" },
              { label: "Live status via WebSockets", sub: "Real-time pipeline events, no polling" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-violet-300 mt-2 flex-shrink-0" />
                <div>
                  <p className="text-white font-bold text-sm">{item.label}</p>
                  <p className="text-violet-300 text-xs mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-violet-400 text-xs font-bold uppercase tracking-widest">
          AI Video Safety Platform
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 bg-slate-950">
        <div className="max-w-sm w-full mx-auto">

          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-violet-400 transition-colors mb-12"
          >
            <ArrowLeft size={13} /> Back to home
          </Link>

          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <div className="-skew-x-6 bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-1.5 inline-block">
              <span className="skew-x-6 inline-block font-black italic text-white tracking-tight text-xl">VIGIL</span>
            </div>
          </div>

          <motion.div
            key={isLogin ? "login" : "register"}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="text-3xl font-black text-white mb-2">
              {isLogin ? "Welcome back." : "Create account."}
            </h1>
            <p className="text-slate-500 text-sm mb-8">
              {isLogin
                ? "Sign in to access your video library."
                : "Start uploading and moderating content today."}
            </p>
          </motion.div>

          {/* Error */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-950/50 text-red-400 border border-red-900/60 p-4 text-xs font-bold mb-6 flex items-center gap-3"
              >
                <AlertCircle size={15} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Email
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-violet-400 transition-colors"
                  size={16}
                />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-slate-800 focus:border-violet-500 focus:ring-0 outline-none transition-colors text-sm font-medium text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Password
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-violet-400 transition-colors"
                  size={16}
                />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-slate-800 focus:border-violet-500 focus:ring-0 outline-none transition-colors text-sm font-medium text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3.5 font-bold flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed mt-2 group cursor-pointer shadow-lg shadow-violet-900/30"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <span>{isLogin ? "Sign In" : "Create Account"}</span>
                  {isLogin
                    ? <LogIn size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    : <UserPlus size={16} />}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/60 text-center">
            <p className="text-slate-500 text-sm">
              {isLogin ? "New here?" : "Already have an account?"}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                className="ml-2 font-black text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
              >
                {isLogin ? "Register" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
