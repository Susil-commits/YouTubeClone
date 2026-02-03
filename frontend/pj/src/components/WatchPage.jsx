import { useEffect, useRef, useState } from "react";
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon, HandThumbUpIcon, HandThumbDownIcon, ShareIcon } from "@heroicons/react/24/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { recordView, fetchPublicVideos, fetchComments, postComment } from "../utils/api";
import VideoCard from "./VideoCard";
import ShareModal from "./ShareModal";
import { AnimatePresence } from "framer-motion";

function WatchPage({ video, onBack, onOpenVideo }) {
  const [currentVideo, setCurrentVideo] = useState(video);
  useEffect(() => { setCurrentVideo(video); }, [video]);
  const [views, setViews] = useState(video?.stats?.views ?? 0);
  const [now, setNow] = useState(() => Date.now());
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const playerRef = useRef(null);
  const [related, setRelated] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showAllInstead, setShowAllInstead] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [subscribed, setSubscribed] = useState(false);
  const [subscribedVideos, setSubscribedVideos] = useState([]);
  const containerRef = useRef(null);
  
  // Custom Progress Bar State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPos, setHoverPos] = useState(0);
  const progressRef = useRef(null);
  const previewVideoRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const [lastPreviewUpdate, setLastPreviewUpdate] = useState(0);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const bookmarksContainerRef = useRef(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (!currentVideo?._id) return;
    try {
      const userId = localStorage.getItem("userId") || "64c9f0f0f0f0f0f0f0f0f0f0";
      const key = `viewed_${userId}`;
      const map = JSON.parse(localStorage.getItem(key) || "{}");
      if (!map[currentVideo._id]) {
        recordView(currentVideo._id)
          .then((res) => {
            if (typeof res?.views === "number") setViews(res.views);
            map[currentVideo._id] = true;
            localStorage.setItem(key, JSON.stringify(map));
          })
          .catch((e) => { void e; });
      }
    } catch (e) { void e; }
      
    const category = currentVideo.category || "All";
    fetchPublicVideos(category).then(list => {
       const others = list.filter(v => v._id !== currentVideo._id).slice(0, 10);
       if (others.length === 0) {
         setShowAllInstead(true);
         fetchPublicVideos("All").then(all => {
           const fallback = all.filter(v => v._id !== currentVideo._id).slice(0, 10);
           setRelated(fallback);
         }).catch((e) => { void e; });
       } else {
         setShowAllInstead(false);
         setRelated(others);
       }
    }).catch((e) => { void e; });
    
  }, [currentVideo?._id, currentVideo?.category]);
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
  }, [currentVideo?._id, currentVideo?.creatorId]);
  useEffect(() => {
    if (playerRef.current) {
      try { playerRef.current.muted = isMuted; } catch (e) { void e; }
    }
  }, [isMuted]);
  useEffect(() => {
    if (playerRef.current) {
      try { playerRef.current.playbackRate = playbackRate; } catch (e) { void e; }
    }
  }, [playbackRate]);
  useEffect(() => {
    function onKey(e) {
      try {
        const v = playerRef.current;
        if (!v) return;
        const tag = (e.target && e.target.tagName) || "";
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (e.code === "Space" || e.key.toLowerCase() === "k") {
          e.preventDefault();
          v.paused ? v.play() : v.pause();
        } else if (e.key.toLowerCase() === "m") {
          setIsMuted((m) => !m);
        } else if (e.key.toLowerCase() === "j") {
          v.currentTime = Math.max(0, v.currentTime - 10);
        } else if (e.key.toLowerCase() === "l") {
          v.currentTime = Math.min(duration || v.duration || v.currentTime + 10, (duration || v.duration || 0));
          if (!duration && v.duration) setDuration(v.duration);
        } else if (e.key === "<") {
          setPlaybackRate((r) => Math.max(0.5, Math.round((r - 0.25) * 100) / 100));
        } else if (e.key === ">") {
          setPlaybackRate((r) => Math.min(2, Math.round((r + 0.25) * 100) / 100));
        }
      } catch (err) { void err; }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [duration]);
  useEffect(() => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setSubscribed(false);
        setSubscribedVideos([]);
        return;
      }
      const subs = JSON.parse(localStorage.getItem(`subscriptions_${userId}`) || "[]");
      if (!Array.isArray(subs) || subs.length === 0) {
        setSubscribedVideos([]);
        return;
      }
      fetchPublicVideos("All").then((all) => {
        try {
          const list = Array.isArray(all) ? all.filter(v => subs.includes(String(v.creatorId))) : [];
          setSubscribedVideos(list.slice(0, 8));
        } catch (e) { void e; }
      }).catch((e) => { void e; });
    } catch (e) { void e; }
  }, [subscribed, currentVideo?.creatorId]);

  const toSeconds = (s) => {
    try {
      const parts = String(s).split(":").map((x) => parseInt(x, 10));
      if (parts.some((n) => Number.isNaN(n))) return null;
      while (parts.length < 3) parts.unshift(0);
      const [h, m, sec] = parts;
      return h * 3600 + m * 60 + sec;
    } catch (e) { void e; return null; }
  };
  const chapterTimes = Array.isArray(currentVideo?.timestamps)
    ? currentVideo.timestamps.map((t) => toSeconds(t.time)).filter((n) => typeof n === "number")
    : [];
  const gotoPrevChapter = () => {
    if (!chapterTimes.length || !playerRef.current) return;
    const ct = playerRef.current.currentTime;
    const prev = [...chapterTimes].filter((s) => s < ct).sort((a, b) => b - a)[0];
    if (typeof prev === "number") playerRef.current.currentTime = prev;
  };
  const gotoNextChapter = () => {
    if (!chapterTimes.length || !playerRef.current) return;
    const ct = playerRef.current.currentTime;
    const next = [...chapterTimes].filter((s) => s > ct).sort((a, b) => a - b)[0];
    if (typeof next === "number") playerRef.current.currentTime = next;
  };
  const enterPiP = async () => {
    const v = playerRef.current;
    if (!v) return;
    try {
      if ("requestPictureInPicture" in v) {
        await v.requestPictureInPicture();
      }
    } catch (e) { void e; }
  };
  const toggleFullscreen = () => {
    try {
      const el = containerRef.current || playerRef.current;
      if (!el) return;
      const doc = document;
      if (doc.fullscreenElement) {
        if (typeof doc.exitFullscreen === "function") doc.exitFullscreen();
      } else {
        if (typeof el.requestFullscreen === "function") el.requestFullscreen();
      }
    } catch (e) { void e; }
  };
  const toggleSubscribe = () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        alert("Please login to subscribe.");
        return;
      }
      const key = `subscriptions_${userId}`;
      const subs = JSON.parse(localStorage.getItem(key) || "[]");
      const cid = String(currentVideo.creatorId || "");
      let next = subs;
      if (subscribed) {
        next = subs.filter((x) => x !== cid);
        setSubscribed(false);
      } else {
        next = Array.from(new Set([...subs, cid]));
        setSubscribed(true);
      }
      localStorage.setItem(key, JSON.stringify(next));
    } catch (e) { void e; }
  };
  useEffect(() => {
    if (!currentVideo?._id) return;
    try {
      const likes = JSON.parse(localStorage.getItem("likeCounts") || "{}");
      const dislikes = JSON.parse(localStorage.getItem("dislikeCounts") || "{}");
      const reactions = JSON.parse(localStorage.getItem("userReactions") || "{}");
      setLikeCount(Number(likes[currentVideo._id] || 0));
      setDislikeCount(Number(dislikes[currentVideo._id] || 0));
      const r = reactions[currentVideo._id] || "none";
      setLiked(r === "like");
      setDisliked(r === "dislike");
      const userId = localStorage.getItem("userId") || "guest";
      const key = `subscriptions_${userId}`;
      try {
        const subs = JSON.parse(localStorage.getItem(key) || "[]");
        const isSub = Array.isArray(subs) && subs.includes(String(currentVideo.creatorId));
        setSubscribed(!!isSub);
      } catch (e) { void e; }
    } catch (e) { void e; }
    fetchComments(currentVideo._id).then((list) => {
      if (Array.isArray(list)) setComments(list);
    }).catch((e) => { void e; });
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
    const nowTs = Date.now();
    if (nowTs - lastPreviewUpdate > 80) {
      setLastPreviewUpdate(nowTs);
      if (previewVideoRef.current) {
        try {
          previewVideoRef.current.currentTime = p * duration;
        } catch (e) { void e; }
      }
    }
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
            <div className="relative group rounded-xl overflow-hidden bg-black shadow-2xl" ref={containerRef}>
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
                onEnded={() => {
                  try {
                    const items = JSON.parse(sessionStorage.getItem("playlistItems") || "[]");
                    const index = parseInt(sessionStorage.getItem("playlistIndex") || "0", 10);
                    const next = index + 1;
                    if (Array.isArray(items) && next < items.length) {
                      sessionStorage.setItem("playlistIndex", String(next));
                      const nextVideo = items[next];
                      if (nextVideo?._id) onOpenVideo?.(nextVideo);
                    } else {
                      sessionStorage.removeItem("playlistItems");
                      sessionStorage.removeItem("playlistIndex");
                    }
                  } catch (e) { void e; }
                }}
              />
              <video 
                ref={previewVideoRef}
                src={currentVideo.videoUrl}
                muted
                playsInline
                style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
                onTimeUpdate={() => {
                  const v = previewVideoRef.current;
                  const c = previewCanvasRef.current;
                  if (!v || !c) return;
                  try {
                    const ctx = c.getContext("2d");
                    const w = c.width;
                    const h = c.height;
                    ctx.drawImage(v, 0, 0, w, h);
                  } catch { void 0; }
                }}
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
                    {hoverTime !== null && (
                       <div 
                         className="absolute bottom-24 -translate-x-1/2 bg-black/80 border border-white/20 rounded-xl p-2 shadow-2xl pointer-events-none z-30"
                         style={{ left: hoverPos }}
                       >
                         <canvas ref={previewCanvasRef} width={240} height={135} className="rounded-lg overflow-hidden bg-black" />
                         <div className="text-center text-xs text-white mt-2">{formatTime(hoverTime)}</div>
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
                        <button
                          className="p-2 rounded-full bg-white text-black hover:bg-zinc-200"
                          onClick={() => setIsMuted((m) => !m)}
                          title={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted ? <SpeakerXMarkIcon className="h-5 w-5" /> : <SpeakerWaveIcon className="h-5 w-5" />}
                        </button>
                        <button
                          className="p-2 rounded-full bg-white text-black hover:bg-zinc-200"
                          onClick={enterPiP}
                          title="Picture-in-Picture"
                        >
                          <span className="text-xs font-bold">PiP</span>
                        </button>
                        <button
                          className="p-2 rounded-full bg-white text-black hover:bg-zinc-200"
                          onClick={toggleFullscreen}
                          title="Fullscreen"
                        >
                          <span className="text-xs font-bold">Full</span>
                        </button>
                        <button
                          className="p-2 rounded-full bg-white text-black hover:bg-zinc-200"
                          onClick={() => {
                            const steps = [0.5, 1, 1.25, 1.5, 2];
                            const idx = steps.findIndex((x) => x === playbackRate);
                            const next = steps[(idx + 1) % steps.length];
                            setPlaybackRate(next);
                          }}
                          title="Playback Speed"
                        >
                          <span className="text-xs font-bold">{playbackRate}x</span>
                        </button>
                        {chapterTimes.length > 0 && (
                          <>
                            <button
                              className="p-2 rounded-full bg-white text-black hover:bg-zinc-200"
                              onClick={gotoPrevChapter}
                              title="Prev Chapter"
                            >
                              <span className="text-xs font-bold">Prev</span>
                            </button>
                            <button
                              className="p-2 rounded-full bg-white text-black hover:bg-zinc-200"
                              onClick={gotoNextChapter}
                              title="Next Chapter"
                            >
                              <span className="text-xs font-bold">Next</span>
                            </button>
                          </>
                        )}
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
                      <button 
                        className={`ml-4 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${subscribed ? "bg-red-600 text-white border-red-500 hover:bg-red-700" : "bg-white text-black border-white hover:bg-zinc-200"}`}
                        onClick={toggleSubscribe}
                        title={subscribed ? "Subscribed" : "Subscribe"}
                      >
                          {subscribed ? "Subscribed" : "Subscribe"}
                      </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-full overflow-hidden border border-white/10 shadow-inner">
                        <button
                          className={`px-4 py-2 hover:bg-zinc-700 flex items-center gap-2 text-sm font-semibold ${liked ? "text-white" : "text-zinc-300"}`}
                          onClick={() => {
                            try {
                              const likes = JSON.parse(localStorage.getItem("likeCounts") || "{}");
                              const dislikes = JSON.parse(localStorage.getItem("dislikeCounts") || "{}");
                              const reactions = JSON.parse(localStorage.getItem("userReactions") || "{}");
                              const prev = reactions[currentVideo._id] || "none";
                              let nextLike = likeCount;
                              let nextDislike = dislikeCount;
                              if (prev === "like") {
                                reactions[currentVideo._id] = "none";
                                nextLike = Math.max(0, likeCount - 1);
                              } else {
                                reactions[currentVideo._id] = "like";
                                nextLike = likeCount + 1;
                                if (prev === "dislike") nextDislike = Math.max(0, dislikeCount - 1);
                              }
                              likes[currentVideo._id] = nextLike;
                              dislikes[currentVideo._id] = nextDislike;
                              localStorage.setItem("likeCounts", JSON.stringify(likes));
                              localStorage.setItem("dislikeCounts", JSON.stringify(dislikes));
                              localStorage.setItem("userReactions", JSON.stringify(reactions));
                              setLiked(true);
                              setDisliked(false);
                              setLikeCount(nextLike);
                              setDislikeCount(nextDislike);
                              } catch {
                              setLiked(!liked);
                              if(!liked) setDisliked(false);
                            }
                          }}
                        >
                           <HandThumbUpIcon className="h-4 w-4" />
                           <span>Like</span>
                           <span className="ml-1 text-xs text-zinc-400">{likeCount}</span>
                        </button>
                        <div className="w-px h-6 bg-zinc-700"></div>
                        <button
                          className={`px-4 py-2 hover:bg-zinc-700 flex items-center gap-2 text-sm font-semibold ${disliked ? "text-white" : "text-zinc-300"}`}
                          onClick={() => {
                            try {
                              const likes = JSON.parse(localStorage.getItem("likeCounts") || "{}");
                              const dislikes = JSON.parse(localStorage.getItem("dislikeCounts") || "{}");
                              const reactions = JSON.parse(localStorage.getItem("userReactions") || "{}");
                              const prev = reactions[currentVideo._id] || "none";
                              let nextLike = likeCount;
                              let nextDislike = dislikeCount;
                              if (prev === "dislike") {
                                reactions[currentVideo._id] = "none";
                                nextDislike = Math.max(0, dislikeCount - 1);
                              } else {
                                reactions[currentVideo._id] = "dislike";
                                nextDislike = dislikeCount + 1;
                                if (prev === "like") nextLike = Math.max(0, likeCount - 1);
                              }
                              likes[currentVideo._id] = nextLike;
                              dislikes[currentVideo._id] = nextDislike;
                              localStorage.setItem("likeCounts", JSON.stringify(likes));
                              localStorage.setItem("dislikeCounts", JSON.stringify(dislikes));
                              localStorage.setItem("userReactions", JSON.stringify(reactions));
                              setDisliked(true);
                              setLiked(false);
                              setLikeCount(nextLike);
                              setDislikeCount(nextDislike);
                              } catch {
                              setDisliked(!disliked);
                              if(!disliked) setLiked(false);
                            }
                          }}
                        >
                           <HandThumbDownIcon className="h-4 w-4" />
                           <span>Dislike</span>
                           <span className="ml-1 text-xs text-zinc-400">{dislikeCount}</span>
                        </button>
                    </div>
                    
                    <button
                      className="btn rounded-full flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border-none"
                      onClick={() => setShowShare(true)}
                    >
                      <ShareIcon className="h-5 w-5" />
                      Share
                    </button>
                  </div>
              </div>
              
              <div className="mt-4 bg-zinc-900/50 rounded-xl p-3 text-sm text-zinc-300">
                <div className="font-bold text-white mb-1">
                  {views} views • {gapLabel(currentVideo.createdAt || currentVideo.created_at || currentVideo.uploadedAt || currentVideo.timestamp)}
                </div>
                <p>{currentVideo.description || "Premium video player experience."}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${subscribed ? "bg-red-600 text-white border-red-500 hover:bg-red-700" : "bg-white text-black border-white hover:bg-zinc-200"}`}
                    onClick={toggleSubscribe}
                    title={subscribed ? "Subscribed" : "Subscribe"}
                  >
                    {subscribed ? "Subscribed" : "Subscribe"}
                  </button>
                  {subscribed && (
                    <span className="px-2 py-1 rounded-full text-[11px] bg-green-700/20 text-green-300 border border-green-600/40">
                      Subscribed to {currentVideo.creatorName || "Channel"}
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <button 
                    className="px-3 py-1.5 text-xs rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300"
                    onClick={() => setShowBookmarks(s => !s)}
                  >
                    {showBookmarks ? "Hide" : "Show"} Precise Bookmarks
                  </button>
                </div>
                {showBookmarks && (
                  <div 
                    ref={bookmarksContainerRef}
                    className="mt-2 h-40 overflow-y-auto custom-scrollbar bg-black/40 border border-zinc-800 rounded-lg p-2"
                  >
                    {(() => {
                      const seconds = Math.max(0, Math.round(duration));
                      const items = [];
                      for (let i = 0; i <= seconds; i++) {
                        const label = `0.${String(i).padStart(2, "0")}`;
                        items.push(
                          <button
                            key={i}
                            className="inline-block m-1 px-2 py-1 text-[11px] rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                            onClick={() => { if (playerRef.current) playerRef.current.currentTime = i; }}
                          >
                            {label}
                          </button>
                        );
                      }
                      return <div className="flex flex-wrap">{items}</div>;
                    })()}
                  </div>
                )}
              </div>
              
              <div className="mt-4 bg-zinc-900/50 rounded-xl p-3">
                <div className="font-semibold text-white mb-2">Comments</div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input 
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment (as Guest User)"
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500"
                    />
                    <button
                      className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200"
                      onClick={() => {
                        const text = commentText.trim();
                        if (!text) return;
                        postComment(currentVideo._id, text).then((entry) => {
                          setComments((cur) => [entry, ...cur]);
                          setCommentText("");
                        }).catch((e) => { void e; });
                      }}
                    >
                      Post
                    </button>
                  </div>
                  <div className="space-y-2">
                    {comments.map((c, idx) => (
                      <div key={idx} className="bg-zinc-800/60 border border-zinc-700 rounded-lg p-2">
                        <div className="text-xs text-zinc-400">{c.authorName || "Guest User"} • {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}</div>
                        <div className="text-sm text-zinc-200">{c.text}</div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <div className="text-xs text-zinc-500">No comments yet.</div>
                    )}
                  </div>
                </div>
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
            <div className="mt-6">
              <h3 className="font-bold text-lg px-1">Subscriptions</h3>
              <div className="flex flex-col gap-3">
                {subscribedVideos.map(v => (
                  <div key={v._id} className="flex gap-2 cursor-pointer group" onClick={() => onOpenVideo?.(v)}>
                    <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-zinc-900 shrink-0">
                      {v.bannerUrl ? <img src={v.bannerUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">▶</div>}
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h4 className="text-sm font-medium text-white line-clamp-2 leading-tight group-hover:text-pink-400 transition-colors">{v.title}</h4>
                      <div className="text-xs text-zinc-400 mt-1">{v.creatorName}</div>
                      <div className="text-xs text-zinc-400">{v.stats?.views || 0} views • {gapLabel(v.createdAt || v.created_at || v.uploadedAt || v.timestamp)}</div>
                    </div>
                  </div>
                ))}
                {subscribedVideos.length === 0 && (
                  <div className="text-xs text-zinc-500 px-2">No subscriptions yet.</div>
                )}
              </div>
            </div>
        </div>

      </div>
      <AnimatePresence>
        {showShare && (
          <ShareModal 
            url={`${window.location.origin}/watch/${currentVideo._id}?t=${Math.floor(currentTime || 0)}`}
            title={currentVideo.title}
            onClose={() => setShowShare(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default WatchPage;
