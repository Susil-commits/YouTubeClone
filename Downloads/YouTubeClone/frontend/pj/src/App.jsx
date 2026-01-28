import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import CreatorStudio from "./components/CreatorStudio";
import AdminVideoManager from "./components/AdminVideoManager";
import AdminLogin from "./components/AdminLogin";
import CreatorAuth from "./components/CreatorAuth";
import WatchPage from "./components/WatchPage";
import Library from "./components/Library";
import Trending from "./components/Trending";
import Subscriptions from "./components/Subscriptions";

function App() {
  const [view, setView] = useState("home");
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem("isAdmin") === "true");
  const [authTarget, setAuthTarget] = useState("home"); 
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  function navigate(next) {
    if (next === "creator") {
      if (!localStorage.getItem("userId")) {
          setAuthTarget("creator");
          return setShowAuthModal(true);
      }
    }
    if (next === "auth" || next === "login") {
        setAuthTarget("home");
        return setShowAuthModal(true);
    }
    if (next === "admin") {
      if (localStorage.getItem("isAdmin") !== "true") return setShowAdminLogin(true);
      setIsAdmin(true);
    }
    setView(next);
  }
  function logout() {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userLogo");
    setShowAdminLogin(false);
    setShowAuthModal(false);
    setIsAdmin(false);
    setView("home");
  }
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  useEffect(() => {
    function onOpenAdmin() {
      setShowAuthModal(false);
      setShowAdminLogin(true);
    }
    window.addEventListener("open-admin-login", onOpenAdmin);
    return () => window.removeEventListener("open-admin-login", onOpenAdmin);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.defaultPrevented) return;
      const t = e.target;
      const tag = (t?.tagName || "").toLowerCase();
      const isEditable = t?.isContentEditable || tag === "input" || tag === "textarea" || tag === "select";
      if (isEditable) return;
      if (e.key === "c") navigate("creator");
      if (e.key === "a") navigate("admin");
      if (e.key === "h") navigate("home");
      if (e.key === "t") navigate("trending");
      if (e.key === "l") navigate("library");
      if (e.key === "s") navigate("subscriptions");
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        const el = document.getElementById("shortcut-help");
        if (el) el.style.display = "block";
      }
      if (e.key === "Escape") {
        const el = document.getElementById("shortcut-help");
        if (el) el.style.display = "none";
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="page">
      <Navbar onNavigate={navigate} onLogout={logout} userName={localStorage.getItem("userName") || ""} userLogo={localStorage.getItem("userLogo") || ""} isAdmin={isAdmin} onSearch={setSearchTerm} showCreate={view !== "creator"} showUserMenu={view !== "creator"} />

      <div className="content relative">
        {view === "home" && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-purple-900/10 to-black" />
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-white/10 blur-3xl" />
          </div>
        )}
        <Sidebar onNavigate={navigate} active={view} />
        {view === "home" && <MainContent searchTerm={searchTerm} onOpen={(v) => { setSelectedVideo(v); setView("watch"); }} />}
        {view === "trending" && <Trending onOpen={(v) => { setSelectedVideo(v); setView("watch"); }} />}
        {view === "subscriptions" && <Subscriptions onOpen={(v) => { setSelectedVideo(v); setView("watch"); }} />}
        {view === "library" && <Library onOpen={(v) => { setSelectedVideo(v); setView("watch"); }} />}
        
        {showAdminLogin && <AdminLogin onSuccess={() => { setShowAdminLogin(false); setView("admin"); }} onCancel={() => setShowAdminLogin(false)} />}
        {showAuthModal && <CreatorAuth 
            mode={authTarget === "creator" ? "creator" : "user"}
            onSuccess={() => {
                setShowAuthModal(false);
                if (authTarget !== "home") setView(authTarget);
            }} 
            onCancel={() => setShowAuthModal(false)} 
        />}

        {view === "creator" && <CreatorStudio onLogout={logout} />}
        {view === "admin" && <AdminVideoManager onLogout={logout} />}
        {view === "watch" && <WatchPage video={selectedVideo} onBack={() => setView("home")} onOpenVideo={(v) => { setSelectedVideo(v); window.scrollTo(0,0); }} />}
      </div>
      <div id="shortcut-help" style={{ display: "none" }} className="fixed inset-0 bg-black/60 z-50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-700 rounded-xl p-4 w-full max-w-md text-sm text-zinc-100">
          <div className="text-lg mb-2">Shortcuts</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>a: Admin</li>
            <li>c: Creator</li>
            <li>h: Home</li>
            <li>t: Trending</li>
            <li>l: Library</li>
            <li>s: Subscriptions</li>
            <li>Esc: Close overlay</li>
            <li>?: Show this help</li>
          </ul>
          <div className="mt-3 flex justify-end">
            <button className="btn" onClick={() => { const el = document.getElementById("shortcut-help"); if (el) el.style.display = "none"; }}>Close</button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default App;
