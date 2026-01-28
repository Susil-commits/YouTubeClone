import { useEffect, useRef, useState } from "react";
import { PlayIcon, PauseIcon } from "@heroicons/react/24/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { recordView, fetchPublicVideos } from "../utils/api";
import VideoCard from "./VideoCard";

function WatchPage({ video, onBack, onOpenVideo }) {
  const [currentVideo, setCurrentVideo] = useState(video);
  useEffect(() => { setCurrentVideo(video); }, [video]);
  const [views, setViews] = useState(video?.stats?.views ?? 0);
  const [now, setNow] = useState(() => Date.now());
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const playerRef = useRef(null);
  const [toast, setToast] = useState("");
  const [related, setRelated] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showAllInstead, setShowAllInstead] = useState(false);
  
  // Custom Progress Bar State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPos, setHoverPos] = useState(0);
  const progressRef = useRef(null);

  useEffect(() => {
    if (!currentVideo?._id) return;
    recordView(currentVideo._id)
      .then((res) => {
        if (typeof res?.views === "number") setViews(res.views);
      })
      .catch(() => {});
      
    const category = currentVideo.category || "All";
    fetchPublicVideos(category).then(list => {
       const others = list.filter(v => v._id !== currentVideo._id).slice(0, 10);
       if (others.length === 0) {
         setShowAllInstead(true);
         fetchPublicVideos("All").then(all => {
           const fallback = all.filter(v => v._id !== currentVideo._id).slice(0, 10);
           setRelated(fallback);
         }).catch(() => {});
       } else {
         setShowAllInstead(false);
         setRelated(others);
       }
    }).catch(() => {});
    
  }, [currentVideo?._id]);
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(i);
  }, []);
  useEffect(() => {
    function onUpdated(e) {
      const updated = e.detail?.video;
      if (updated?._id && currentVideo?._id === updated._id) {
        setCurrentVideo(updated);
      }
    }
    window.addEventListener("video-updated", onUpdated);
    return () => window.removeEventListener("video-updated", onUpdated);
  }, [currentVideo?._id]);

  const formatTime = (t) => {
    if (!t && t !== 0) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };
  const gapLabel = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const ms = date.getTime();
    if (Number.isNaN(ms)) return "";
    const diff = Math.max(0, now - ms);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours`;
    const days = Math.floor(hours / 24);
    return `${days} days`;
  };

  const handleProgressHover = (e) => {
    if (!duration || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const p = Math.max(0, Math.min(1, x / rect.width));
    setHoverTime(p * duration);
    setHoverPos(x);
  };

  const handleSeek = (e) => {
    if (!duration || !progressRef.current || !playerRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const p = Math.max(0, Math.min(1, x / rect.width));
    playerRef.current.currentTime = p * duration;
  };

  if (!currentVideo) {
    return (
      <div className="flex-1 p-4">
        <button className="btn mb-3" onClick={() => onBack?.()}>Back</button>
        <div className="text-sm text-zinc-400">No video selected</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 custom-scrollbar">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Player & Info */}
        <div className="lg:col-span-2 space-y-4">
            <div className="relative group rounded-xl overflow-hidden border border-zinc-800 bg-black shadow-2xl">
              <button 
                className="absolute top-2 left-2 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 text-white"
                title="Back"
                onClick={() => onBack?.()}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <video
                ref={playerRef}
                src={currentVideo.videoUrl}
                className="w-full aspect-video"
                controls={false} // Custom controls
                autoPlay
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={(e) => e.currentTarget.paused ? e.currentTarget.play() : e.currentTarget.pause()}
              />
              
              {/* Custom Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 {/* Progress Bar Container */}
                 <div 
                   className="relative h-1.5 bg-zinc-600/50 cursor-pointer hover:h-2 transition-all mb-4 group/bar"
                   ref={progressRef}
                   onMouseMove={handleProgressHover}
                   onMouseLeave={() => setHoverTime(null)}
                   onClick={handleSeek}
                 >
                    {/* Hover Time Pill */}
                    {hoverTime !== null && (
                        <div 
                          className="absolute bottom-4 -translate-x-1/2 bg-black/90 text-white text-xs font-bold px-2 py-1 rounded border border-white/10 pointer-events-none z-20"
                          style={{ left: hoverPos }}
                        >
                            {formatTime(hoverTime)}
                        </div>
                    )}
                    
                    {/* Progress Fill */}
                    <div 
                      className="absolute top-0 left-0 h-full bg-red-600"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    >
                       <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full scale-0 group-hover/bar:scale-100 transition-transform" />
                    </div>
                 </div>

                 <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                        <button 
                          className="p-2 rounded-full bg-white text-black hover:bg-zinc-200"
                          onClick={() => playerRef.current.paused ? playerRef.current.play() : playerRef.current.pause()}
                          title={isPlaying ? "Pause" : "Play"}
                        >
                          {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                        </button>
                        <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                 </div>
              </div>
            </div>

            <div>
              <h1 className="text-xl font-bold text-white mb-2">{currentVideo.title}</h1>
              <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden">
                          {currentVideo.creatorLogo ? <img src={currentVideo.creatorLogo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold">{(currentVideo.creatorName||"?")[0]}</div>}
                      </div>
                      <div>
                          <div className="font-medium text-white">{currentVideo.creatorName}</div>
                          <div className="text-xs text-zinc-400">1.2M subscribers</div>
                      </div>
                      <button className="ml-4 bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-zinc-200">
                          Subscribe
                      </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-zinc-800 rounded-full overflow-hidden">
                        <button
                          className={`px-4 py-2 hover:bg-zinc-700 flex items-center gap-2 text-sm font-medium ${liked ? "text-white" : "text-zinc-300"}`}
                          onClick={() => {
                            setLiked(!liked);
                            if(!liked) setDisliked(false);
                          }}
                        >
                           Like {liked && "1"}
                        </button>
                        <div className="w-px h-6 bg-zinc-700"></div>
                        <button
                          className={`px-4 py-2 hover:bg-zinc-700 flex items-center gap-2 text-sm font-medium ${disliked ? "text-white" : "text-zinc-300"}`}
                          onClick={() => {
                            setDisliked(!disliked);
                            if(!disliked) setLiked(false);
                          }}
                        >
                           Dislike
                        </button>
                    </div>
                    
                    <button
                      className="btn rounded-full flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border-none"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        setToast("Link copied");
                        setTimeout(() => setToast(""), 2000);
                      }}
                    >
                      Share
                    </button>
                  </div>
              </div>
              
              <div className="mt-4 bg-zinc-900/50 rounded-xl p-3 text-sm text-zinc-300">
                <div className="font-bold text-white mb-1">
                  {views} views • {gapLabel(currentVideo.createdAt || currentVideo.created_at || currentVideo.uploadedAt || currentVideo.timestamp)}
                </div>
                <p>{currentVideo.description || "Premium video player experience."}</p>
              </div>
            </div>
        </div>


        <div className="space-y-4">
            <h3 className="font-bold text-lg px-1">{showAllInstead ? "Videos" : "Related Videos"}</h3>
            <div className="flex flex-col gap-3">
                {related.map(v => (
                    <div key={v._id} className="flex gap-2 cursor-pointer group" onClick={() => onOpenVideo?.(v)}>
                        <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-zinc-900 shrink-0">
                             {v.bannerUrl ? <img src={v.bannerUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">▶</div>}
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                            <h4 className="text-sm font-medium text-white line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">{v.title}</h4>
                            <div className="text-xs text-zinc-400 mt-1">{v.creatorName}</div>
                            <div className="text-xs text-zinc-400">{v.stats?.views || 0} views • {gapLabel(v.createdAt || v.created_at || v.uploadedAt || v.timestamp)}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

export default WatchPage;
