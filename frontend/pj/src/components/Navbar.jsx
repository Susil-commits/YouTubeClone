import { useState, useEffect, useRef } from "react";
import { fetchNotifications } from "../utils/api";
import { MagnifyingGlassIcon, UserCircleIcon, PlusIcon, ShieldCheckIcon, ArrowRightOnRectangleIcon, PlayCircleIcon, BellIcon } from "@heroicons/react/24/outline";

function Navbar({ onNavigate, onLogout, userName, userLogo, isAdmin, onSearch, showCreate = true, showUserMenu = true }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
      if (userName) {
          fetchNotifications().then(list => {
              if (Array.isArray(list)) setNotifications(list);
          }).catch(() => {});
          
          // Poll every 30s
          const interval = setInterval(() => {
              fetchNotifications().then(list => {
                  if (Array.isArray(list)) setNotifications(list);
              }).catch(() => {});
          }, 30000);
          return () => clearInterval(interval);
      }
  }, [userName]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="navbar flex items-center justify-between px-4 py-2 bg-black border-b border-zinc-800 sticky top-0 z-50">

      <div className="flex items-center gap-4">
        <div 
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => onNavigate("home")}
        >
            <div className="bg-red-600 p-1.5 rounded-full">
                <PlayCircleIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white">MyTube</span>
        </div>
      </div>

      <div className="flex-1 flex justify-center px-4 max-w-2xl mx-auto">
        <div className="relative w-full">
          <div className="flex">
            <input
                type="text"
                placeholder="Search"
                className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 rounded-l-full focus:outline-none focus:border-blue-500 placeholder-zinc-500"
                onChange={(e) => {
                const val = e.target.value;
                clearTimeout(window.__searchTimer);
                window.__searchTimer = setTimeout(() => onSearch?.(val), 250);
                }}
            />
            <button className="bg-zinc-800 border border-l-0 border-zinc-700 px-5 rounded-r-full hover:bg-zinc-700 transition-colors">
                <MagnifyingGlassIcon className="h-5 w-5 text-zinc-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isAdmin && (
             <button className="btn" title="Admin Panel" onClick={() => onNavigate("admin")}>
                <ShieldCheckIcon className="h-6 w-6" />
             </button>
        )}

        {userName ? (
            <>
                {showCreate && (
                  <button 
                      className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-full text-sm font-medium transition-colors border border-zinc-700"
                      onClick={() => onNavigate("creator")}
                  >
                      <PlusIcon className="h-5 w-5" />
                      <span>Create</span>
                  </button>
                )}

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button 
                        className="p-2 hover:bg-zinc-800 rounded-full transition-colors relative"
                        onClick={() => setShowNotifs(!showNotifs)}
                    >
                        <BellIcon className="h-6 w-6 text-white" />
                        {unreadCount > 0 && (
                            <div className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold px-1 rounded-full border-2 border-black min-w-[18px] text-center">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </div>
                        )}
                    </button>
                    {showNotifs && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-zinc-800 rounded-xl shadow-2xl py-2 z-50 border border-zinc-700 max-h-96 overflow-auto custom-scrollbar">
                            <h3 className="px-4 py-2 text-sm font-bold text-white border-b border-zinc-700 flex justify-between items-center">
                                <span>Notifications</span>
                            </h3>
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-zinc-500 text-sm">No notifications</div>
                            ) : (
                                notifications.map((n, i) => (
                                    <div key={i} className="px-4 py-3 hover:bg-zinc-700/50 transition-colors border-b border-zinc-700/50 last:border-0 cursor-pointer">
                                        <p className="text-sm text-white line-clamp-2">{n.message}</p>
                                        <p className="text-xs text-zinc-500 mt-1">{new Date(n.date).toLocaleDateString()}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
                
                {showUserMenu && (
                  <div className="relative group cursor-pointer ml-2">
                      {userLogo ? (
                        <img src={userLogo} className="h-8 w-8 rounded-full object-cover ring-2 ring-black" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold shadow-lg ring-2 ring-black">
                          {userName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute right-0 top-full mt-2 w-32 bg-zinc-800 rounded-lg shadow-xl py-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50 border border-zinc-700">
                           <button 
                              className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2"
                              onClick={() => onLogout?.()}
                          >
                              <ArrowRightOnRectangleIcon className="h-4 w-4" />
                              Sign out
                          </button>
                      </div>
                  </div>
                )}
            </>
        ) : (
            <button 
                className="flex items-center gap-2 text-blue-400 border border-zinc-700 hover:bg-blue-900/20 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                onClick={() => onNavigate("login")} 
            >
                <UserCircleIcon className="h-5 w-5" />
                Sign in
            </button>
        )}
      </div>

    </header>
  );
}

export default Navbar;
