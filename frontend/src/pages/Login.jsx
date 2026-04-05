import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Mail, Lock, ArrowRight,AlertCircle, Loader2, UserPlus, LogIn } from "lucide-react";

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
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-slate-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-100/50 border border-slate-100"
      >
        {/* BRANDING SECTION */}
        <div className="flex flex-col items-center mb-10 text-center">
          <motion.div 
            whileHover={{ rotate: 10 }}
            className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200 text-white mb-4"
          >
            <ShieldCheck size={32} />
          </motion.div>
          <p className="text-slate-400 text-[10px] mt-1 font-black uppercase tracking-[0.2em]">
            Autonomous Video Security
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">
            {isLogin ? "Welcome back" : "Join the Engine"}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {isLogin ? "Securely access your video library." : "Start uploading and moderating content today."}
          </p>
        </div>

        {/* ERROR FEEDBACK */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 mb-6 flex items-center gap-3"
            >
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* EMAIL INPUT */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 ml-1 uppercase tracking-widest">Work Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="email" 
                placeholder="name@company.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* PASSWORD INPUT */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 ml-1 uppercase tracking-widest">Secret Key</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-600 hover:shadow-2xl hover:shadow-indigo-100 transition-all active:scale-[0.98] disabled:bg-slate-300 disabled:cursor-not-allowed mt-4 group cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                <span>{isLogin ? "Sign In to Dashboard" : "Create My Account"}</span>
                {isLogin ? <LogIn size={18} className="group-hover:translate-x-1 transition-transform" /> : <UserPlus size={18} />}
              </>
            )}
          </button>
        </form>

        {/* TOGGLE LOGIN/REGISTER */}
        <div className="mt-10 pt-6 border-t border-slate-50 text-center">
          <p className="text-slate-500 text-sm">
            {isLogin ? "New to the platform?" : "Already have an account?"} 
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 font-black text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer decoration-2 underline underline-offset-4"
            >
              {isLogin ? "Register Now" : "Login Here"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}