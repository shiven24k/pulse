import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Upload, Film, Cpu, Zap, Lock, ArrowRight, CheckCircle2 } from "lucide-react";

const pipeline = [
  {
    step: "01",
    icon: <Upload size={22} />,
    title: "Upload",
    desc: "An editor or admin uploads a video. Multer buffers it locally so FFmpeg can extract three key frames for analysis.",
  },
  {
    step: "02",
    icon: <Cpu size={22} />,
    title: "Dual AI Scan",
    desc: "NSFW.js (TensorFlow.js) screens for adult content locally. Clarifai's API concurrently flags violence, gore, and weapons.",
  },
  {
    step: "03",
    icon: <Film size={22} />,
    title: "HLS Delivery",
    desc: "Clean videos upload to Cloudinary and transcode into 480p, 720p, and 1080p adaptive HLS streams — ready for playback.",
  },
];

const features = [
  {
    icon: <Cpu size={20} />,
    title: "Dual-Model AI Moderation",
    desc: "Two independent models — NSFW.js for adult content, Clarifai for violence and weapons — run on every extracted frame before a video is approved.",
    badge: "TensorFlow.js · Clarifai",
    from: "from-violet-500/10",
    to: "to-indigo-500/10",
    accent: "border-l-2 border-violet-500/40",
  },
  {
    icon: <Film size={20} />,
    title: "Adaptive HLS Streaming",
    desc: "Safe videos are encoded and delivered from Cloudinary's CDN as multi-quality HLS streams. HLS.js handles in-browser playback across all devices.",
    badge: "Cloudinary · FFmpeg · HLS.js",
    from: "from-emerald-500/10",
    to: "to-teal-500/10",
    accent: "border-l-2 border-emerald-500/40",
  },
  {
    icon: <Zap size={20} />,
    title: "Live Processing Status",
    desc: "Socket.IO pushes real-time events — analyzing, processing, safe, flagged — so the UI reflects the exact pipeline stage without any polling.",
    badge: "Socket.IO · WebSockets",
    from: "from-amber-500/10",
    to: "to-orange-500/10",
    accent: "border-l-2 border-amber-500/40",
  },
  {
    icon: <Lock size={20} />,
    title: "Role-Based Access Control",
    desc: "Three JWT-authenticated tiers: Viewers see only safe content, Editors upload and track their own videos, Admins have full system control.",
    badge: "JWT · RBAC",
    from: "from-rose-500/10",
    to: "to-pink-500/10",
    accent: "border-l-2 border-rose-500/40",
  },
];

const techStack = [
  "React 19", "Node.js", "Express", "MongoDB",
  "TensorFlow.js", "NSFW.js", "Clarifai API",
  "Cloudinary", "FFmpeg", "HLS.js",
  "Socket.IO", "JWT", "Framer Motion", "Tailwind CSS",
];

const tiers = [
  {
    role: "Viewer",
    color: "slate",
    desc: "Browse and watch any video that passed the AI safety check.",
    perms: ["Watch safe videos", "Real-time status updates"],
  },
  {
    role: "Editor",
    color: "emerald",
    desc: "Upload new content. Videos are held in the pipeline until AI clears them.",
    perms: ["Everything a Viewer can", "Upload videos", "Track own pending/flagged content"],
  },
  {
    role: "Admin",
    color: "violet",
    desc: "Full system access — delete content, manage users, assign roles.",
    perms: ["Everything an Editor can", "Delete any video", "Manage user roles", "See all content"],
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/60 backdrop-blur-md bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <div className="-skew-x-6 bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-1.5 inline-block">
            <span className="skew-x-6 inline-block font-black italic text-white tracking-tight text-xl">VIGIL</span>
          </div>
          <Link
            to="/login"
            className="text-sm font-bold text-slate-300 hover:text-white border border-slate-700 hover:border-violet-500 px-5 py-2 transition-all"
          >
            Sign In →
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative max-w-7xl mx-auto px-8 pt-28 pb-36 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-violet-500/8 blur-[150px] pointer-events-none" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="relative"
        >
          <div className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-violet-400 border border-violet-500/20 bg-violet-500/5 px-5 py-2 mb-10">
            AI · HLS Streaming · WebSockets · RBAC
          </div>

          <h1 className="text-6xl md:text-[82px] font-black leading-[1.0] tracking-tighter mb-7">
            The content safety<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-blue-400">
              layer it needs.
            </span>
          </h1>

          <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed mb-12">
            VIGIL intercepts every upload with dual AI moderation — then delivers
            clean content as adaptive HLS streams with live status via WebSockets.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link
              to="/login"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-10 py-4 font-bold text-base transition-all hover:shadow-2xl hover:shadow-violet-500/25"
            >
              Explore Demo <ArrowRight size={18} />
            </Link>
            <a
              href="#pipeline"
              className="text-slate-400 hover:text-white border border-slate-800 hover:border-slate-600 px-10 py-4 font-bold text-base transition-all"
            >
              How It Works
            </a>
          </div>

          {/* Inline pipeline flow */}
          <div className="inline-flex items-stretch border border-slate-800 bg-slate-900/40">
            {[
              { label: "Upload", sub: "Multer + FFmpeg" },
              { label: "Dual AI Scan", sub: "NSFW.js + Clarifai" },
              { label: "HLS Delivery", sub: "Cloudinary CDN" },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center">
                <div className="px-7 py-4 text-center">
                  <p className="text-white font-bold text-sm">{s.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{s.sub}</p>
                </div>
                {i < 2 && (
                  <div className="w-px self-stretch bg-slate-800 relative">
                    <div className="absolute top-1/2 -translate-y-1/2 -right-[5px] w-2.5 h-2.5 border-r-2 border-t-2 border-slate-600 rotate-45" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── PIPELINE ── */}
      <section id="pipeline" className="max-w-7xl mx-auto px-8 pb-32">
        <div className="border-t border-slate-800/60 pt-20 mb-16 flex items-end justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-violet-400 mb-3">Pipeline</p>
            <h2 className="text-4xl font-black">How It Works</h2>
          </div>
          <span className="text-slate-700 text-xs font-bold uppercase tracking-widest pb-1">Three stages</span>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-slate-800/40">
          {pipeline.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
              viewport={{ once: true }}
              className="bg-slate-950 p-10 relative overflow-hidden group hover:bg-slate-900/50 transition-colors"
            >
              <div className="absolute top-3 right-6 text-[7rem] font-black text-slate-800/50 leading-none select-none">
                {step.step}
              </div>
              <div className="bg-violet-500/10 text-violet-400 w-12 h-12 flex items-center justify-center mb-8 group-hover:bg-violet-500/20 transition-colors">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="max-w-7xl mx-auto px-8 pb-32">
        <div className="border-t border-slate-800/60 pt-20 mb-16">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-violet-400 mb-3">Features</p>
          <h2 className="text-4xl font-black">Built to Solve Real Problems</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-slate-800/40">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              className={`bg-gradient-to-br ${f.from} ${f.to} p-10 ${f.accent} relative group`}
            >
              <div className="bg-white/10 w-10 h-10 flex items-center justify-center mb-6 text-white">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">{f.desc}</p>
              <span className="text-xs font-bold text-slate-500 bg-black/20 border border-white/5 px-3 py-1.5">
                {f.badge}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section className="max-w-7xl mx-auto px-8 pb-32">
        <div className="border-t border-slate-800/60 pt-20 mb-12">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-violet-400 mb-3">Stack</p>
          <h2 className="text-4xl font-black">Technologies Used</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {techStack.map((tech) => (
            <motion.span
              key={tech}
              whileHover={{ y: -2 }}
              className="bg-slate-900 border border-slate-800 hover:border-violet-500/50 hover:text-white text-slate-400 px-5 py-2.5 text-sm font-bold transition-all cursor-default"
            >
              {tech}
            </motion.span>
          ))}
        </div>
      </section>

      {/* ── ACCESS TIERS ── */}
      <section className="max-w-7xl mx-auto px-8 pb-32">
        <div className="border-t border-slate-800/60 pt-20 mb-16">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-violet-400 mb-3">Access Control</p>
          <h2 className="text-4xl font-black">Three Permission Tiers</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-slate-800/40">
          {tiers.map((tier) => (
            <motion.div
              key={tier.role}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-slate-900/50 p-10"
            >
              <span className={`inline-block px-3 py-1 text-xs font-black uppercase tracking-widest mb-6 ${
                tier.color === "violet" ? "bg-violet-500/20 text-violet-400" :
                tier.color === "emerald" ? "bg-emerald-500/20 text-emerald-400" :
                "bg-slate-700/60 text-slate-400"
              }`}>
                {tier.role}
              </span>
              <p className="text-slate-500 text-sm leading-relaxed mb-7">{tier.desc}</p>
              <ul className="space-y-3">
                {tier.perms.map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 size={13} className="text-violet-500 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-8 pb-32">
        <div
          className="bg-gradient-to-br from-violet-700 to-indigo-600 p-20 text-center relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative">
            <h2 className="text-4xl font-black mb-4">Watch the Pipeline Run</h2>
            <p className="text-violet-200 mb-10 text-lg max-w-lg mx-auto">
              Sign in to upload a video and watch dual AI, real-time events, and HLS delivery happen live.
            </p>
            <Link
              to="/login"
              className="bg-white text-violet-700 px-10 py-4 font-black text-lg hover:bg-violet-50 transition-all inline-flex items-center gap-2"
            >
              Open Demo <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800/60 py-8 px-8 max-w-7xl mx-auto flex justify-between items-center">
        <div className="-skew-x-6 bg-gradient-to-r from-violet-600 to-indigo-500 px-3 py-1 inline-block">
          <span className="skew-x-6 inline-block font-black italic text-white tracking-tight text-sm">VIGIL</span>
        </div>
        <p className="text-slate-600 text-sm">Full-stack AI video moderation platform</p>
      </footer>
    </div>
  );
}
