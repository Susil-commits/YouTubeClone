import { useEffect, useMemo, useState, useRef } from "react";
import { SpeakerWaveIcon, SpeakerXMarkIcon, EllipsisVerticalIcon, BookmarkIcon, ShareIcon, TrashIcon } from "@heroicons/react/24/solid";
import { recordView } from "../utils/api";
import ShareModal from "./ShareModal";
import { AnimatePresence, motion } from "framer-motion";

function TimeGapMeta({ video }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(i);
  }, []);
  const createdMs = useMemo(() => {
    const d = video.createdAt || video.created_at || video.uploadedAt || video.timestamp;
    if (!d) return null;
    const date = new Date(d);
    const ms = date.getTime();
    return Number.isNaN(ms) ? null : ms;
  }, [video.createdAt, video.timestamp]);
  const label = useMemo(() => {
    if (!createdMs) return "";
    const diff = Math.max(0, now - createdMs);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours`;
    const days = Math.floor(hours / 24);
    return `${days} days`;
  }, [now, createdMs]);
  return (
    <div className="meta text-xs text-zinc-400 mt-1">
      <span>{video.stats?.views ?? 0} views</span>
      {label && (
        <>
          <span className="dot" />
          <span>{label}</span>
        </>
      )}
    </div>
  );
}

function VideoCard({ video, onOpen }) {
  const [isHovering, setIsHovering] = useState(false);
  const [overlayMuted, setOverlayMuted] = useState(true);
  const [viewSent, setViewSent] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [saved, setSaved] = useState(() => {
    const savedList = JSON.parse(localStorage.getItem("savedVideos") || "[]");
    return savedList.includes(video._id);
  });
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [vidDuration, setVidDuration] = useState(0);

  const toggleSave = (e) => {
    e.stopPropagation();
    const savedList = JSON.parse(localStorage.getItem("savedVideos") || "[]");
    let newList;
    if (saved) {
      newList = savedList.filter(id => id !== video._id);
    } else {
      newList = [...savedList, video._id];
    }
    localStorage.setItem("savedVideos", JSON.stringify(newList));
    setSaved(!saved);
    setShowMenu(false);
  };

  // Handle hover interactions
  const handleMouseEnter = () => {
      setIsHovering(true);
      // Record view count once per session when user shows interest
      if (!viewSent) {
        setViewSent(true);
        recordView(video._id).catch(() => {});
      }
  };

  const handleMouseLeave = () => {
      setIsHovering(false);
      setShowMenu(false);
      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch (e) { void e; }
      }
      setCurrentTime(0);
  };

  // Format time helper
  const formatTime = (t) => {
    if (!t && t !== 0) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <>
    <div
      className="video-card group cursor-pointer relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onOpen?.(video)}
    >
      {/* Thumbnail Container */}
      <div className="thumb relative aspect-video bg-zinc-900 rounded-xl overflow-hidden">
        {/* Banner Image - Always present, uses lazy loading */}
        {video.bannerUrl ? (
          <img
            src={video.bannerUrl}
            alt={video.title}
            loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${isHovering ? "opacity-0" : "opacity-100"}`}
          />
        ) : (
           <div className="w-full h-full flex items-center justify-center text-zinc-700">
             <span className="text-3xl font-bold">▶</span>
           </div>
        )}
        
        {/* Video Player - Only rendered on hover for performance */}
        {isHovering && (
          <video
            ref={videoRef}
            src={video.videoUrl}
            autoPlay
            playsInline
            muted={overlayMuted}
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover z-10 filter blur-[1px]"
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration || 0;
              setVidDuration(d);
            }}
          />
        )}

        {/* Top Right Menu Button */}
        <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
             className="bg-black/60 text-white p-1.5 rounded-full border border-white/10 hover:bg-black/90"
             onClick={(e) => {
               e.stopPropagation();
               setShowMenu(!showMenu);
             }}
           >
             <EllipsisVerticalIcon className="h-5 w-5" />
           </button>
           
           <AnimatePresence>
             {showMenu && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: -10 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: -10 }}
                 className="absolute right-0 top-full mt-2 w-32 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden flex flex-col z-40"
                 onClick={e => e.stopPropagation()}
               >
                 <button 
                   onClick={toggleSave}
                   className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white text-left w-full"
                 >
                   <BookmarkIcon className={`h-4 w-4 ${saved ? "text-blue-500" : ""}`} />
                   {saved ? "Saved" : "Save"}
                 </button>
                 <button 
                   onClick={() => {
                     setShowShare(true);
                     setShowMenu(false);
                   }}
                   className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white text-left w-full"
                 >
                   <ShareIcon className="h-4 w-4" />
                   Share
                 </button>
                 <button 
                   onClick={() => setOverlayMuted(!overlayMuted)}
                   className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white text-left w-full"
                 >
                   {overlayMuted ? <SpeakerXMarkIcon className="h-4 w-4" /> : <SpeakerWaveIcon className="h-4 w-4" />}
                   {overlayMuted ? "Unmute" : "Mute"}
                 </button>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Progress Bar & Time on Hover */}
        {isHovering && vidDuration > 0 && (
          <>
            <span className="absolute right-1.5 bottom-2.5 z-20 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide">{formatTime(currentTime)}</span>
            <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col gap-1 pointer-events-none">
               {/* Floating Progress Bar (narrow, centered, touching bottom) */}
               <div className="h-[4px] w-full bg-zinc-600/50 overflow-hidden">
                  <div 
                    className="h-full bg-red-600 transition-all duration-200"
                    style={{ width: `${(currentTime / vidDuration) * 100}%` }}
                  />
               </div>
            </div>
          </>
        )}

        {video.settings?.adminMuteOverride && <span className="badge left-2 top-2 z-20 absolute bg-orange-600">Muted by Admin</span>}
      </div>
      
      {/* Video Info */}
      <div className="card-body mt-3">
         <div className="flex gap-3 items-start">
            {/* Creator Avatar */}
            <div className="shrink-0">
                {video.creatorLogo ? (
                <img src={video.creatorLogo} className="w-9 h-9 rounded-full object-cover mt-1" alt="" />
                ) : (
                <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white mt-1">
                    {(video.creatorName || "?").slice(0, 1).toUpperCase()}
                </div>
                )}
            </div>
            
            {/* Title & Metadata */}
            <div className="flex-1 min-w-0">
              <h3 className="title line-clamp-2 text-base font-medium leading-tight text-white group-hover:text-blue-400 transition-colors">{video.title}</h3>
              <div className="text-sm text-zinc-400 mt-1 flex items-center gap-1">
                 <span>{video.creatorName}</span>
              </div>
              <TimeGapMeta video={video} />
            </div>
         </div>
      </div>
    </div>
    <AnimatePresence>
      {showShare && (
        <ShareModal 
          url={`${window.location.origin}/watch/${video._id}`}
          title={video.title}
          onClose={() => setShowShare(false)}
        />
      )}
    </AnimatePresence>
    </>
  );
}

export default VideoCard;
