import { useEffect, useState } from "react";
import { fetchPublicVideos } from "../utils/api";
import { FireIcon, PlayIcon } from "@heroicons/react/24/solid";

function Trending({ onOpen }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicVideos("All")
      .then((list) => {
         const sorted = [...list].sort((a, b) => (b.stats?.views || 0) - (a.stats?.views || 0));
         setVideos(sorted.slice(0, 10)); 
      })
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    function refresh() {
      fetchPublicVideos("All")
        .then((list) => {
          const sorted = [...list].sort((a, b) => (b.stats?.views || 0) - (a.stats?.views || 0));
          setVideos(sorted.slice(0, 10));
        })
        .catch(() => {});
    }
    function onUpdated() { refresh(); }
    function onDeleted() { refresh(); }
    window.addEventListener("video-updated", onUpdated);
    window.addEventListener("video-deleted", onDeleted);
    const interval = setInterval(refresh, 30000);
    return () => {
      window.removeEventListener("video-updated", onUpdated);
      window.removeEventListener("video-deleted", onDeleted);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex-1 overflow-auto custom-scrollbar bg-black text-white relative">
      {/* Premium Background Glow */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-red-900/20 to-black pointer-events-none" />

      <div className="relative p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 rounded-full bg-gradient-to-br from-red-600 to-orange-600 text-white shadow-lg shadow-red-900/50">
              <FireIcon className="h-8 w-8 animate-pulse" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                Trending Now
            </h1>
            <p className="text-zinc-400 mt-1 font-medium">Top videos taking over the platform</p>
          </div>
        </div>

        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1,2,3].map(i => (
                    <div key={i} className="aspect-video bg-zinc-800 rounded-xl" />
                ))}
            </div>
        ) : (
            <div className="space-y-6">
                {/* #1 Trending (Featured) */}
                {videos.length > 0 && (
                    <div 
                        className="group relative w-full h-[280px] md:h-[360px] lg:h-[420px] rounded-2xl overflow-hidden cursor-pointer shadow-xl shadow-red-900/20 border border-zinc-800 hover:border-red-500/50 transition-all"
                        onClick={() => onOpen(videos[0])}
                    >
                        {videos[0].bannerUrl ? (
                            <img src={videos[0].bannerUrl} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                            <video src={videos[0].videoUrl} className="w-full h-full object-cover" muted />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                        
                        <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            #1 ON TRENDING
                        </div>

                        <div className="absolute bottom-0 left-0 p-6 w-full md:w-1/2">
                            <h2 className="text-2xl md:text-4xl font-black mb-2 line-clamp-2 drop-shadow-lg">
                                {videos[0].title}
                            </h2>
                            <div className="flex items-center gap-3 text-zinc-300 mb-3 text-base">
                                <span className="font-bold text-white">{videos[0].creatorName}</span>
                                <span>•</span>
                                <span>{new Date(videos[0].createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/90 font-medium text-sm">
                                <PlayIcon className="h-6 w-6" />
                                <span>Watch Now</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rest of the list */}
                <div className="grid grid-cols-1 gap-4 pt-4">
                    {videos.slice(1).map((v, i) => (
                        <div 
                            key={v._id}
                            className="flex gap-4 md:gap-6 p-4 rounded-xl hover:bg-zinc-900/60 border border-transparent hover:border-zinc-700/50 transition-all cursor-pointer group"
                            onClick={() => onOpen(v)}
                        >
                            <div className="hidden sm:flex items-center justify-center w-8 text-3xl font-black text-zinc-700 group-hover:text-zinc-500 transition-colors">
                                {i + 2}
                            </div>
                            
                            <div className="relative w-40 md:w-64 aspect-video rounded-xl overflow-hidden bg-zinc-800 shadow-lg">
                                {v.bannerUrl ? (
                                    <img src={v.bannerUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <video src={v.videoUrl} className="w-full h-full object-cover" muted />
                                )}
                            </div>

                            <div className="flex-1 py-1 min-w-0">
                                <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-red-400 transition-colors line-clamp-2">
                                    {v.title}
                                </h3>
                                <div className="text-zinc-400 text-sm mt-1 font-medium">
                                    {v.creatorName}
                                </div>
                                <div className="text-zinc-500 text-xs mt-1">
                                    {(v.stats?.views || 0).toLocaleString()} views • {new Date(v.createdAt).toLocaleDateString()}
                                </div>
                                <p className="text-zinc-400 text-sm mt-3 line-clamp-1 md:line-clamp-2 pr-4">
                                    {v.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

export default Trending;
