import { useEffect, useState } from "react";
import { fetchPublicVideos } from "../utils/api";
import VideoCard from "./VideoCard";
import { BookmarkIcon, ArchiveBoxIcon, PlayIcon } from "@heroicons/react/24/outline";

function Library({ onOpen }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedIds = JSON.parse(localStorage.getItem("savedVideos") || "[]");
    
    if (savedIds.length === 0) {
        setVideos([]);
        setLoading(false);
        return;
    }

    fetchPublicVideos()
      .then((all) => {
         const saved = all.filter(v => savedIds.includes(v._id));
         setVideos(saved);
      })
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 overflow-auto custom-scrollbar bg-black text-white relative">
       <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-blue-900/20 to-black pointer-events-none" />

       <div className="relative p-6 max-w-7xl mx-auto">
         {/* Header */}
         <div className="flex items-center gap-4 mb-10">
            <div className="p-4 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <BookmarkIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Library</h1>
              <p className="text-zinc-400 text-sm mt-1">Your personal collection of saved videos</p>
            </div>
          </div>

          {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
                {[1,2,3,4].map(i => (
                    <div key={i} className="aspect-video bg-zinc-800 rounded-xl" />
                ))}
             </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-zinc-500 bg-zinc-900/20 rounded-3xl border border-zinc-800/50 backdrop-blur-sm">
                <ArchiveBoxIcon className="h-24 w-24 mb-6 opacity-20" />
                <h3 className="text-2xl font-bold text-white mb-2">Your library is empty</h3>
                <p className="mb-8 text-center max-w-md">Save videos to watch them later. They will appear here.</p>
                <button 
                    onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'h'}))} // Hacky nav to home or just explain
                    className="px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-colors"
                >
                    Browse Videos
                </button>
            </div>
          ) : (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-zinc-400 font-medium uppercase tracking-wider">
                        Saved Videos ({videos.length})
                    </div>
                    <button className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                        <PlayIcon className="h-4 w-4" />
                        Play All
                    </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {videos.map(v => (
                        <VideoCard key={v._id} video={v} onOpen={onOpen} />
                    ))}
                </div>
            </div>
          )}
       </div>
    </div>
  );
}

export default Library;
