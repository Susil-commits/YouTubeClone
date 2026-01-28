import { useState, useEffect, useMemo } from "react";
import { fetchPublicVideos } from "../utils/api";
import VideoCard from "./VideoCard";
import { RectangleStackIcon, UserGroupIcon, PlayCircleIcon } from "@heroicons/react/24/outline";

function Subscriptions({ onOpen }) {
  const [videos, setVideos] = useState([]);
  const [subs, setSubs] = useState([]);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load subscriptions from local storage
    const s = JSON.parse(localStorage.getItem("subscriptions") || "[]");
    setSubs(s);
    
    fetchPublicVideos()
        .then(list => setVideos(list))
        .finally(() => setLoading(false));
  }, []);

  const channels = useMemo(() => {
    if (!subs || subs.length === 0) return [];
    const map = new Map();
    // Initialize with subscribed names
    for (const name of subs) {
      map.set(name, { name, logo: "", count: 0, latestVideo: null });
    }
    // Populate with video data
    for (const v of videos) {
      if (map.has(v.creatorName)) {
        const entry = map.get(v.creatorName);
        entry.count += 1;
        if (v.creatorLogo && !entry.logo) entry.logo = v.creatorLogo;
        if (!entry.latestVideo) entry.latestVideo = v; 
        map.set(v.creatorName, entry);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [subs, videos]);

  const creatorVideos = useMemo(() => {
    if (!selectedCreator) return [];
    return videos.filter(v => v.creatorName === selectedCreator);
  }, [videos, selectedCreator]);

  const isLoggedIn = !!localStorage.getItem("userName"); 

  return (
    <div className="flex-1 overflow-auto custom-scrollbar bg-black text-white relative">
        <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-purple-900/20 to-black pointer-events-none" />

        <div className="relative p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="p-4 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30">
                    <RectangleStackIcon className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
                    <p className="text-zinc-400 text-sm mt-1">Latest from your favorite creators</p>
                </div>
            </div>

            {!isLoggedIn ? (
                <div className="flex flex-col items-center justify-center py-32 text-zinc-500 bg-zinc-900/20 rounded-3xl border border-zinc-800/50 backdrop-blur-sm">
                    <UserGroupIcon className="h-24 w-24 mb-6 opacity-20" />
                    <h3 className="text-2xl font-bold text-white mb-2">Don't miss out</h3>
                    <p className="mb-8 text-center max-w-md">Sign in to see updates from your favorite YouTube channels.</p>
                </div>
            ) : channels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-zinc-500 bg-zinc-900/20 rounded-3xl border border-zinc-800/50 backdrop-blur-sm">
                    <RectangleStackIcon className="h-24 w-24 mb-6 opacity-20" />
                    <h3 className="text-xl font-bold text-white mb-2">No subscriptions yet</h3>
                    <p>Subscribe to channels to see them here.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Horizontal Channel List (Stories style) */}
                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                        {channels.map(ch => (
                            <button
                                key={ch.name}
                                onClick={() => setSelectedCreator(selectedCreator === ch.name ? null : ch.name)}
                                className={`flex flex-col items-center gap-2 min-w-[100px] snap-start group transition-all ${selectedCreator === ch.name ? 'scale-105' : 'hover:scale-105'}`}
                            >
                                <div className={`relative w-20 h-20 rounded-full p-1 ${selectedCreator === ch.name ? 'bg-gradient-to-tr from-purple-500 to-pink-500' : 'bg-zinc-800 group-hover:bg-zinc-700'}`}>
                                    <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center text-xl font-bold border-2 border-black">
                                        {ch.logo ? (
                                            <img src={ch.logo} className="w-full h-full object-cover" />
                                        ) : (
                                            ch.name.slice(0, 1).toUpperCase()
                                        )}
                                    </div>
                                    {ch.count > 0 && (
                                        <div className="absolute bottom-0 right-0 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-black shadow-lg">
                                            {ch.count}
                                        </div>
                                    )}
                                </div>
                                <span className={`text-xs font-medium truncate w-full text-center ${selectedCreator === ch.name ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                                    {ch.name}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Videos Grid */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {selectedCreator ? `Videos by ${selectedCreator}` : "Recent Uploads"}
                            </h2>
                            {selectedCreator && (
                                <button 
                                    onClick={() => setSelectedCreator(null)}
                                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    Show All
                                </button>
                            )}
                        </div>

                        {selectedCreator && creatorVideos.length === 0 ? (
                            <div className="text-zinc-500 text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                                <p>No videos uploaded yet for this channel.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {(selectedCreator ? creatorVideos : videos.filter(v => subs.includes(v.creatorName))).map(v => (
                                    <VideoCard key={v._id} video={v} onOpen={onOpen} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}

export default Subscriptions;
