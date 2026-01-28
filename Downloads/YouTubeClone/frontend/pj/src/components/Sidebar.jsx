import { HomeIcon, FireIcon, RectangleStackIcon, BookmarkIcon } from "@heroicons/react/24/outline";

function Sidebar({ onNavigate, active }) {
  return (
    <div className="sidebar">
      <button className={`sideitem flex items-center gap-2 w-full text-left ${active==="home"?"bg-zinc-800":""}`} onClick={() => onNavigate?.("home")}><HomeIcon className="h-5 w-5" /> Home</button>
      <button className={`sideitem flex items-center gap-2 w-full text-left ${active==="trending"?"bg-zinc-800":""}`} onClick={() => onNavigate?.("trending")}><FireIcon className="h-5 w-5" /> Trending</button>
      <button className={`sideitem flex items-center gap-2 w-full text-left ${active==="subscriptions"?"bg-zinc-800":""}`} onClick={() => onNavigate?.("subscriptions")}><RectangleStackIcon className="h-5 w-5" /> Subscriptions</button>
      <button className={`sideitem flex items-center gap-2 w-full text-left ${active==="library"?"bg-zinc-800":""}`} onClick={() => onNavigate?.("library")}><BookmarkIcon className="h-5 w-5" /> Library</button>
    </div>
  );
}

export default Sidebar;
