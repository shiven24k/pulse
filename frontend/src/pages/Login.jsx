import { useState } from "react";
import { Link } from "react-router-dom";
import { useSignIn, useSignUp } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, AlertCircle, Loader2, UserPlus, LogIn, ArrowLeft } from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function Login() {
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signInLoaded || !signUpLoaded) return;
    setError("");
    setLoading(true);

    try {
      if (pendingVerification) {
        const result = await signUp.attemptEmailAddressVerification({ code: verificationCode });
        if (result.status === "complete") {
          await setSignUpActive({ session: result.createdSessionId });
        } else {
          throw new Error(`Verification incomplete: ${result.status}`);
        }
        return;
      }

      if (isLogin) {
        // Step 1: identify the user
        let result = await signIn.create({ identifier: email });

        // Step 2: if Clerk needs password as a separate factor, attempt it
        if (result.status === "needs_first_factor") {
          result = await signIn.attemptFirstFactor({
            strategy: "password",
            password,
          });
        }

        if (result.status === "complete") {
          await setSignInActive({ session: result.createdSessionId });
        } else if (result.status === "needs_second_factor") {
          throw new Error("This account has MFA enabled. Disable it in your Clerk dashboard under Configure → Multi-factor authentication.");
        } else {
          throw new Error(`Sign-in incomplete (${result.status}). Check Clerk dashboard settings.`);
        }
      } else {
        const result = await signUp.create({ emailAddress: email, password });
        if (result.status === "complete") {
          await setSignUpActive({ session: result.createdSessionId });
        } else {
          // Email verification required — send code
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
          setPendingVerification(true);
        }
      }
    } catch (err) {
      console.error("[Login] auth error:", err);
      setError(
        err.errors?.[0]?.longMessage ||
        err.errors?.[0]?.message ||
        err.message ||
        "Authentication failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!signInLoaded) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: "/dashboard",
      });
    } catch (err) {
      setError(err.errors?.[0]?.message || "Google sign-in failed.");
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setPendingVerification(false);
    setVerificationCode("");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-600 p-14 relative overflow-hidden">
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

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-violet-400 transition-colors mb-12"
          >
            <ArrowLeft size={13} /> Back to home
          </Link>

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
              {pendingVerification ? "Check your email." : isLogin ? "Welcome back." : "Create account."}
            </h1>
            <p className="text-slate-500 text-sm mb-8">
              {pendingVerification
                ? "Enter the verification code we sent you."
                : isLogin
                ? "Sign in to access your video library."
                : "Start uploading and moderating content today."}
            </p>
          </motion.div>

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

          {!pendingVerification && (
            <>
              {/* Google sign-in */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-slate-900 border border-slate-700 hover:border-slate-500 text-white text-sm font-bold transition-colors mb-4 cursor-pointer"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-slate-600 text-xs font-bold uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {pendingVerification ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Verification code
                </label>
                <input
                  type="text"
                  placeholder="Enter code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-3.5 bg-slate-900 border border-slate-800 focus:border-violet-500 focus:ring-0 outline-none transition-colors text-sm font-medium text-white placeholder:text-slate-600 tracking-widest"
                />
              </div>
            ) : (
              <>
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
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3.5 font-bold flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed mt-2 group cursor-pointer shadow-lg shadow-violet-900/30"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <span>
                    {pendingVerification ? "Verify Email" : isLogin ? "Sign In" : "Create Account"}
                  </span>
                  {!pendingVerification && (
                    isLogin
                      ? <LogIn size={16} className="group-hover:translate-x-0.5 transition-transform" />
                      : <UserPlus size={16} />
                  )}
                </>
              )}
            </button>
          </form>

          {!pendingVerification && (
            <div className="mt-8 pt-6 border-t border-slate-800/60 text-center">
              <p className="text-slate-500 text-sm">
                {isLogin ? "New here?" : "Already have an account?"}
                <button
                  onClick={switchMode}
                  className="ml-2 font-black text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
                >
                  {isLogin ? "Register" : "Sign in"}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
