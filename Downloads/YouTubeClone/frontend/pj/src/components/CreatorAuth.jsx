import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadLogoFile } from "../utils/api";

function CreatorAuth({ mode, onSuccess, onCancel }) {
  const [phase, setPhase] = useState("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [logoProgress, setLogoProgress] = useState(0);
  const [logoUrl, setLogoUrl] = useState("");

  const isRegister = phase === "register";
  const title = mode === "creator" ? "Creator Studio" : "Sign In";

  async function register() {
    setError("");
    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, role: mode, logo: logoUrl })
      });
      if (res.status === 409) {
        setError("Email already registered. Please sign in.");
        setPhase("login");
        return;
      }
      if (!res.ok) throw new Error("Registration failed");
      const data = await res.json();
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("userName", data.name);
      localStorage.setItem("userLogo", data.logo || ""); // Ensure logo is saved if available
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  }

  async function login() {
    setError("");
    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("userName", data.name);
      localStorage.setItem("userLogo", data.logo || "");
      onSuccess?.();
    } catch {
      setError("Invalid login credentials");
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/20 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
            <button 
              onClick={() => onCancel?.()}
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isRegister) {
                register();
              } else {
                login();
              }
            }}
          >
            <div className="space-y-4">
              {isRegister && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400 ml-1">Full Name</label>
                  <input 
                    className="w-full bg-black/50 border border-zinc-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-600" 
                    placeholder="John Doe" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                </div>
              )}
              {isRegister && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 ml-1">Logo (optional)</label>
                  <LogoDropzone 
                    preview={logoPreview}
                    progress={logoProgress}
                    onDrop={async (file) => {
                      setLogoPreview(URL.createObjectURL(file));
                      setLogoProgress(0);
                      try {
                        const res = await uploadLogoFile(file, setLogoProgress);
                        setLogoUrl(res.url);
                      } catch {
                        setError("Logo upload failed");
                        setLogoPreview("");
                        setLogoProgress(0);
                        setLogoUrl("");
                      }
                    }}
                  />
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400 ml-1">Email Address</label>
                <input 
                  className="w-full bg-black/50 border border-zinc-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-600" 
                  placeholder="you@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
  
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400 ml-1">Password</label>
                <input 
                  className="w-full bg-black/50 border border-zinc-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-600" 
                  placeholder="••••••••" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div className="mt-6">
              <button 
                type="submit"
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5 cursor-pointer" 
              >
                {isRegister ? "Create Account" : "Sign In"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-zinc-400 text-sm">
              {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
              <button 
                type="button"
                className="text-blue-400 hover:text-blue-300 font-medium hover:underline transition-all" 
                onClick={() => setPhase(isRegister ? "login" : "register")}
              >
                {isRegister ? "Sign In" : "Register"}
              </button>
            </p>
            <div className="mt-4 pt-4 border-t border-zinc-800">
               <button 
                 className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                 onClick={() => {
                   // Dispatch a custom event or use a callback if provided to switch to admin
                   // Since we can't easily access setView/setShowAdminLogin from here directly without props, 
                   // we'll assume the parent (App) handles a specific "admin" mode or we add a prop.
                   // However, based on App.jsx, we need to close this and open AdminLogin.
                   // We'll emit an event that App.jsx listens to, or better yet, use a prop if available.
                   // Checking App.jsx: <CreatorAuth ... onCancel={() => setShowAuthModal(false)} />
                   // Let's modify App.jsx to pass a onSwitchToAdmin prop or handle it via a global event/hack? 
                   // No, let's just use window.dispatchEvent or similar if we don't want to change App.jsx interface too much.
                   // Actually, simplest is to add a prop `onSwitchToAdmin` in App.jsx.
                   onCancel?.(); 
                   window.dispatchEvent(new CustomEvent("open-admin-login"));
                 }}
               >
                 Log in as Admin
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogoDropzone({ preview, progress, onDrop }) {
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] },
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    onDropAccepted: (files) => {
      const f = files[0];
      if (f) onDrop(f);
    }
  });
  return (
    <div 
      {...getRootProps()} 
      className={`border border-dashed rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'}`}
    >
      <input {...getInputProps()} />
      {preview ? (
        <img src={preview} className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <div className="h-10 w-10 rounded-full bg-zinc-800" />
      )}
      <div className="flex-1">
        <div className="text-xs text-zinc-400">Upload an image</div>
        {progress > 0 && <div className="h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden"><div className="h-full bg-blue-600" style={{ width: `${progress}%` }} /></div>}
      </div>
    </div>
  );
}

export default CreatorAuth;
