import { useEffect, useMemo, useState } from "react";
import { adminMuteOverride, adminSetApproved, fetchAllVideosAdmin, adminDeleteVideo, adminSetVisibility } from "../utils/api";
import { AnimatePresence, motion } from "framer-motion";
import { EyeIcon, EyeSlashIcon, SpeakerWaveIcon, SpeakerXMarkIcon, TrashIcon, PlayIcon, XMarkIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";

function AdminVideoManager({ onLogout }) {
  const [videos, setVideos] = useState([]);
  const [query, setQuery] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir] = useState("desc");
  useEffect(() => {
    fetchAllVideosAdmin().then(setVideos);
  }, []);
  useEffect(() => {
    function onUpdated(e) {
      const updated = e.detail?.video;
      if (!updated?._id) return;
      setVideos((list) => {
        const idx = list.findIndex(x => x._id === updated._id);
        if (idx === -1) return list;
        const next = [...list];
        next[idx] = updated;
        return next;
      });
    }
    function onDeleted(e) {
      const id = e.detail?.id;
      if (!id) return;
      setVideos(list => list.filter(v => v._id !== id));
    }
    window.addEventListener("video-updated", onUpdated);
    window.addEventListener("video-deleted", onDeleted);
    return () => {
      window.removeEventListener("video-updated", onUpdated);
      window.removeEventListener("video-deleted", onDeleted);
    };
  }, []);

  async function toggleGlobalMute(v) {
    const updated = await adminMuteOverride(v._id, !(v.settings?.adminMuteOverride));
    setVideos((list) => list.map((x) => (x._id === v._id ? updated : x)));
  }

  async function toggleVisibility(v) {
      const newVis = v.settings?.visibility === "private" ? "public" : "private";
      const updated = await adminSetVisibility(v._id, newVis);
      setVideos((list) => list.map((x) => (x._id === v._id ? updated : x)));
  }

  async function setApproved(v, approved) {
    const updated = await adminSetApproved(v._id, approved);
    setVideos((list) => list.map((x) => (x._id === v._id ? updated : x)));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter((v) => {
      const title = String(v.title || "").toLowerCase();
      const creator = String(v.creatorId || "").toLowerCase();
      const creatorName = String(v.creatorName || "").toLowerCase();
      return title.includes(q) || creator.includes(q) || creatorName.includes(q);
    });
  }, [videos, query]);

  const MotionTr = motion.tr;

  const [previewVideo, setPreviewVideo] = useState(null);

  return (
    <div className="flex-1 p-6 bg-black text-white overflow-hidden flex flex-col relative">
      {/* Premium Background Effects */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 z-10" />
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-red-600/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-orange-600/10 blur-3xl rounded-full pointer-events-none" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
           <div className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Admin Dashboard</div>
           <p className="text-zinc-400 text-sm mt-1">Manage content, users, and platform settings</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
             <input
                className="bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-2.5 w-80 pl-10 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all text-sm placeholder:text-zinc-500 backdrop-blur-sm"
                placeholder="Search videos, creators..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <svg className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
          </div>
          <button onClick={onLogout} className="px-4 py-2.5 bg-zinc-900/80 hover:bg-red-900/20 text-zinc-300 hover:text-red-400 border border-zinc-700/50 hover:border-red-900/30 rounded-xl text-sm font-medium transition-all backdrop-blur-sm flex items-center gap-2">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
             </svg>
             Logout
          </button>
        </div>
      </div>
      
      <div className="bg-zinc-900/40 rounded-2xl overflow-hidden border border-zinc-800/50 flex-1 flex flex-col min-h-0 backdrop-blur-sm relative z-10 shadow-xl">
        <div className="overflow-auto custom-scrollbar flex-1">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400 sticky top-0 z-10">
            <tr className="text-left">
              <th className="p-4 font-medium">Preview</th>
              <th className="p-4 font-medium">Video Details</th>
              <th className="p-4 font-medium">Creator</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            <AnimatePresence initial={false}>
              {[...filtered]
                .sort((a, b) => {
                  let av = sortKey === "title" ? String(a.title || "") : new Date(a.createdAt || 0).getTime();
                  let bv = sortKey === "title" ? String(b.title || "") : new Date(b.createdAt || 0).getTime();
                  if (av < bv) return sortDir === "asc" ? -1 : 1;
                  if (av > bv) return sortDir === "asc" ? 1 : -1;
                  return 0;
                })
                .map((v) => (
                <MotionTr
                  key={v._id}
                  className="hover:bg-zinc-800/50 transition-colors"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                >
                  <td className="p-4 w-48">
                      <div 
                        className="aspect-video bg-black rounded-lg overflow-hidden border border-zinc-700/50 relative group cursor-pointer"
                        onClick={() => setPreviewVideo(v)}
                      >
                          {v.bannerUrl ? (
                              <img src={v.bannerUrl} className="w-full h-full object-cover" />
                          ) : (
                              <video src={v.videoUrl} className="w-full h-full object-cover" muted />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <PlayIcon className="h-8 w-8 text-white" />
                          </div>
                      </div>
                  </td>
                  <td className="p-4">
                      <div className="font-medium text-base text-white mb-1">{v.title}</div>
                      <div className="text-xs text-zinc-500 font-mono">{v._id}</div>
                      <div className="text-xs text-zinc-400 mt-1">{new Date(v.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden border border-zinc-600">
                            {v.creatorLogo ? (
                                <img src={v.creatorLogo} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-sm font-bold text-white">{(v.creatorName || "U").slice(0, 1).toUpperCase()}</span>
                            )}
                        </div>
                        <div>
                            <div className="font-medium text-white">{v.creatorName || "Unknown"}</div>
                            <div className="text-xs text-zinc-500">Creator</div>
                        </div>
                      </div>
                  </td>
                  <td className="p-4">
                      <div className="flex flex-col gap-2">
                          <div className={`text-xs px-2 py-1 rounded-full w-fit ${v.settings?.visibility === "public" ? "bg-green-900/30 text-green-400 border border-green-900" : "bg-red-900/30 text-red-400 border border-red-900"}`}>
                              {v.settings?.visibility || "public"}
                          </div>
                          {v.settings?.adminMuteOverride && (
                              <div className="text-xs px-2 py-1 rounded-full w-fit bg-orange-900/30 text-orange-400 border border-orange-900">
                                  Muted by Admin
                              </div>
                          )}
                      </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-end relative">
                      <button 
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === v._id ? null : v._id);
                        }}
                      >
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>

                      <AnimatePresence>
                          {activeMenuId === v._id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50 flex flex-col"
                                onClick={e => e.stopPropagation()}
                              >
                                  <button 
                                    className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white text-left transition-colors"
                                    onClick={() => {
                                        toggleVisibility(v);
                                        setActiveMenuId(null);
                                    }}
                                  >
                                    {v.settings?.visibility === "private" ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                                    {v.settings?.visibility === "private" ? "Unhide Video" : "Hide Video"}
                                  </button>
                                  
                                  <button 
                                    className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white text-left transition-colors"
                                    onClick={() => {
                                        toggleGlobalMute(v);
                                        setActiveMenuId(null);
                                    }}
                                  >
                                    {v.settings?.adminMuteOverride ? <SpeakerXMarkIcon className="h-4 w-4" /> : <SpeakerWaveIcon className="h-4 w-4" />}
                                    {v.settings?.adminMuteOverride ? "Unmute Audio" : "Force Mute"}
                                  </button>

                                  <div className="h-px bg-zinc-800 my-1"></div>

                                  <button 
                                    className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 text-left transition-colors"
                                    onClick={() => {
                                        setConfirmId(v._id);
                                        setActiveMenuId(null);
                                    }}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                    Delete Video
                                  </button>
                              </motion.div>
                          )}
                      </AnimatePresence>
                    </div>
                  </td>
                </MotionTr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
      {confirmId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-lg font-bold mb-2">Delete Video?</div>
            <div className="text-zinc-400 text-sm mb-6">This action cannot be undone. The video will be permanently removed.</div>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors" onClick={() => setConfirmId(null)}>Cancel</button>
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
                onClick={async () => {
                  await adminDeleteVideo(confirmId);
                  setVideos((list) => list.filter((x) => x._id !== confirmId));
                  setConfirmId(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {previewVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setPreviewVideo(null)}>
            <div className="bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl w-full max-w-4xl border border-zinc-700" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <h3 className="text-lg font-bold">{previewVideo.title}</h3>
                    <button className="btn p-1" onClick={() => setPreviewVideo(null)}>
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="aspect-video bg-black">
                    <video 
                        src={previewVideo.videoUrl} 
                        controls 
                        autoPlay 
                        className="w-full h-full"
                    />
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default AdminVideoManager;
