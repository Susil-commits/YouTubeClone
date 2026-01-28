import { useEffect, useMemo, useState } from "react";
import { createVideo, fetchMyVideos, updateVideo, uploadVideoFile, deleteVideo } from "../utils/api";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { CloudArrowUpIcon, PencilIcon, TrashIcon, VideoCameraIcon, PhotoIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

function CreatorStudio({ onLogout }) {
  const [videos, setVideos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", videoUrl: "", visibility: "public", isMuted: false, category: "other", description: "" });
  const [editing, setEditing] = useState(null);
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [successUrl, setSuccessUrl] = useState("");
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [bannerProgress, setBannerProgress] = useState(0);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [editData, setEditData] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    fetchMyVideos().then(setVideos);
  }, []);
  useEffect(() => {
    if (file && step === 2 && !uploading && progress === 0) {
      startUpload();
    }
  }, [file, step]);

  async function submitNew() {
    // If banner file exists but not uploaded yet (edge case), might want to upload it first
    // For now assuming user clicked upload banner
    const doc = await createVideo(form);
    setVideos((v) => [doc, ...v]);
    setShowForm(false);
    resetForm();
  }
  
  function resetForm() {
    setForm({ title: "", videoUrl: "", visibility: "public", isMuted: false, category: "other", description: "" });
    setStep(1);
    setFile(null);
    setPreviewUrl("");
    setProgress(0);
    setUploading(false);
    setSuccessUrl("");
    setBannerFile(null);
    setBannerPreview("");
    setBannerProgress(0);
  }

  async function saveEdit(id, payload) {
    const updated = await updateVideo(id, payload);
    setVideos((list) => list.map((v) => (v._id === id ? updated : v)));
    try {
      window.dispatchEvent(new CustomEvent("video-updated", { detail: { video: updated } }));
    } catch {}
    setEditing(null);
    setEditData(null);
  }

  async function remove(id) {
    setConfirmId(id);
  }

  const maxSize = 500 * 1024 * 1024; // 500MB
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "video/mp4": [".mp4"], "video/webm": [".webm"] },
    maxSize,
    multiple: false,
    onDropAccepted: (files) => {
      const f = files[0];
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      setStep(2);
    }
  });
  const bannerDrop = useDropzone({
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] },
    multiple: false,
    onDropAccepted: async (files) => {
      const f = files[0];
      setBannerFile(f);
      setBannerPreview(URL.createObjectURL(f));
      // Auto upload banner for simplicity
      const res = await uploadVideoFile(f, setBannerProgress);
      setForm((cur) => ({ ...cur, bannerUrl: res.url }));
    }
  });

  async function startUpload() {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const res = await uploadVideoFile(file, setProgress);
      setForm((cur) => ({ ...cur, videoUrl: res.url }));
      setSuccessUrl(res.url);
      setUploading(false);
      setStep(3); // Move to details step
    } catch {
      setUploading(false);
      alert("Upload failed");
    }
  }

  return (
    <div className="flex-1 overflow-auto custom-scrollbar bg-black text-white p-6 relative">
       {/* Background */}
       <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-zinc-900 to-black pointer-events-none" />
       
       <div className="relative max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Channel Content</h1>
                    <p className="text-zinc-400 text-sm mt-1">Manage your videos and live streams</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-medium transition-all shadow-lg shadow-blue-900/20"
                      onClick={() => { setShowForm(true); resetForm(); }}
                  >
                      <VideoCameraIcon className="h-5 w-5" />
                      <span>Create</span>
                  </button>
                  <button onClick={() => onLogout?.()} className="px-4 py-2.5 bg-zinc-900/80 hover:bg-red-900/20 text-zinc-300 hover:text-red-400 border border-zinc-700/50 hover:border-red-900/30 rounded-xl text-sm font-medium transition-all backdrop-blur-sm flex items-center gap-2">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                     </svg>
                     Logout
                  </button>
                </div>
            </div>

            {/* Video List */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <div className="col-span-6">Video</div>
                    <div className="col-span-2">Visibility</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>
                
                {videos.length === 0 ? (
                    <div className="text-center py-20 text-zinc-500">
                        <VideoCameraIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p>No videos uploaded yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800">
                        {videos.map(v => (
                            <div key={v._id} className="grid grid-cols-12 gap-4 p-4 hover:bg-zinc-800/50 transition-colors items-center group">
                                <div className="col-span-6 flex gap-4">
                                    <div className="w-32 aspect-video bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0 relative cursor-pointer" onClick={() => setPreviewVideo(v)}>
                                        {v.bannerUrl ? (
                                            <img src={v.bannerUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <video src={v.videoUrl} className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-1 rounded text-white">
                                            {/* Duration placeholder */}
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-white truncate text-base mb-1 cursor-pointer hover:text-blue-400" onClick={() => setEditData({ ...v })}>
                                            {v.title}
                                        </h3>
                                        <p className="text-xs text-zinc-500 line-clamp-1">{v.description || "No description"}</p>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <div className="flex items-center gap-2">
                                        {["public","private","unlisted"].map(opt => (
                                            <button
                                                key={opt}
                                                className={`px-2 py-1 rounded-full text-xs border ${v.settings?.visibility===opt?"bg-blue-600 text-white border-blue-500":"bg-zinc-800 text-zinc-300 border-zinc-700"}`}
                                                onClick={() => saveEdit(v._id, { visibility: opt })}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-span-2 text-sm text-zinc-400">
                                    {new Date(v.createdAt).toLocaleDateString()}
                                </div>
                                <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        className="p-2 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white"
                                        onClick={() => setEditData({ ...v })}
                                        title="Edit details"
                                    >
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button 
                                        className="p-2 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-red-400"
                                        onClick={() => remove(v._id)}
                                        title="Delete forever"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
       </div>

       {/* Upload Modal Overlay */}
       {showForm && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
               <div className="bg-zinc-900 w-full max-w-4xl h-[80vh] rounded-2xl border border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                   {/* Modal Header */}
                   <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                       <h2 className="text-xl font-bold">Upload Video</h2>
                       <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 hover:bg-zinc-800 rounded-full">✕</button>
                   </div>

                   {/* Modal Body */}
                   <div className="flex-1 overflow-auto p-8">
                       {step === 1 && (
                           <motion.div 
                                {...getRootProps()} 
                                initial={{ scale: 1 }}
                                animate={{ scale: isDragActive ? 1.02 : 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className={`h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'}`}
                           >
                               <input {...getInputProps()} />
                               <motion.div 
                                  className="p-6 rounded-full bg-zinc-800 mb-6"
                                  whileHover={{ scale: 1.05 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                               >
                                   <CloudArrowUpIcon className="h-12 w-12 text-zinc-400" />
                               </motion.div>
                               <h3 className="text-xl font-medium mb-2">Drag and drop video files to upload</h3>
                               <p className="text-zinc-500 mb-6">Your videos will be private until you publish them.</p>
                               <button className="btn bg-blue-600 hover:bg-blue-700 text-white border-none px-6">Select Files</button>
                           </motion.div>
                       )}

                       {step === 2 && (
                           <div className="flex flex-col items-center justify-center h-full text-center">
                               <div className="w-full max-w-md mb-8">
                                    <div className="flex justify-between text-sm mb-2 text-zinc-400">
                                        <span>{uploading ? "Uploading..." : "Ready to upload"}</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                                    </div>
                               </div>
                               {!uploading && progress === 0 && <div className="text-zinc-400 text-sm">Preparing upload...</div>}
                           </div>
                       )}

                       {step === 3 && (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="space-y-4">
                                   <div>
                                       <label className="block text-sm font-medium text-zinc-400 mb-1">Title (required)</label>
                                       <input 
                                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none" 
                                            placeholder="Add a title that describes your video"
                                            value={form.title}
                                            onChange={e => setForm({...form, title: e.target.value})}
                                       />
                                   </div>
                                   <div>
                                       <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                                       <textarea 
                                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 h-32 resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none" 
                                            placeholder="Tell viewers about your video"
                                            value={form.description}
                                            onChange={e => setForm({...form, description: e.target.value})}
                                       />
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Thumbnail</label>
                                       <motion.div 
                                           {...bannerDrop.getRootProps()} 
                                           initial={{ scale: 1 }}
                                           whileHover={{ scale: 1.02 }}
                                           transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                           className="border border-dashed border-zinc-700 rounded-lg p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors flex items-center gap-4"
                                       >
                                            <input {...bannerDrop.getInputProps()} />
                                            {bannerPreview ? (
                                                <img src={bannerPreview} className="h-20 w-32 object-cover rounded" />
                                            ) : (
                                                <div className="h-20 w-32 bg-zinc-800 rounded flex items-center justify-center">
                                                    <PhotoIcon className="h-8 w-8 text-zinc-500" />
                                                </div>
                                            )}
                                            <div className="text-sm text-zinc-400">
                                                {bannerPreview ? "Click to change" : "Upload thumbnail"}
                                            </div>
                                        </motion.div>
                                   </div>
                               </div>

                               <div className="space-y-6">
                                   <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-800">
                                       <video src={previewUrl} className="w-full rounded-lg mb-4 bg-black aspect-video" controls />
                                       <div className="flex gap-2 text-xs text-zinc-400">
                                           <span className="truncate">Video Link: <span className="text-blue-400">{successUrl}</span></span>
                                       </div>
                                   </div>

                                   <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-1">Visibility</label>
                                            <div className="flex items-center gap-2">
                                                {["public","private","unlisted"].map(opt => (
                                                    <button
                                                        key={opt}
                                                        className={`px-3 py-1.5 rounded-full text-sm border ${form.visibility===opt?"bg-blue-600 text-white border-blue-500":"bg-zinc-800 text-zinc-300 border-zinc-700"}`}
                                                        onClick={() => setForm({...form, visibility: opt})}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-1">Category</label>
                                            <select 
                                                className="w-full bg-black border border-zinc-700 rounded-lg p-2"
                                                value={form.category}
                                                onChange={e => setForm({...form, category: e.target.value})}
                                            >
                                                <option value="other">Other</option>
                                                <option value="music">Music</option>
                                                <option value="gaming">Gaming</option>
                                                <option value="news">News</option>
                                                <option value="education">Education</option>
                                                <option value="travel">Travel</option>
                                            </select>
                                        </div>
                                   </div>
                               </div>
                           </div>
                       )}
                   </div>

                   {/* Modal Footer */}
                   <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900">
                       {step > 1 && (
                           <button className="btn bg-transparent hover:bg-zinc-800" onClick={() => setStep(s => s - 1)}>Back</button>
                       )}
                       {step === 3 && (
                           <button 
                                className="btn bg-blue-600 hover:bg-blue-700 text-white px-8"
                                onClick={submitNew}
                                disabled={!form.title}
                            >
                                Publish
                            </button>
                       )}
                   </div>
               </div>
           </div>
       )}
       {previewVideo && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setPreviewVideo(null)}>
           <div className="bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl w-full max-w-4xl border border-zinc-700" onClick={e => e.stopPropagation()}>
             <div className="flex items-center justify-between p-4 border-b border-zinc-800">
               <h3 className="text-lg font-bold">{previewVideo.title}</h3>
               <button className="btn p-1" onClick={() => setPreviewVideo(null)}>✕</button>
             </div>
             <div className="aspect-video bg-black">
               <video src={previewVideo.videoUrl} controls autoPlay className="w-full h-full" />
             </div>
           </div>
         </div>
       )}
      {editData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setEditData(null)}>
          <div className="bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl w-full max-w-3xl border border-zinc-700 relative" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/20 blur-3xl rounded-full pointer-events-none" />
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 relative z-10">
              <h3 className="text-lg font-bold">Edit Video</h3>
              <button className="p-2 hover:bg-zinc-800 rounded-full" onClick={() => setEditData(null)}>✕</button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
               <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
                  <input className="w-full bg-black border border-zinc-700 rounded-lg p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                  <textarea className="w-full bg-black border border-zinc-700 rounded-lg p-3 h-28 resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={editData.description || ""} onChange={e => setEditData({ ...editData, description: e.target.value })} />
                </div>
                 <div className="flex items-center gap-2">
                   {["public","private","unlisted"].map(opt => (
                     <button key={opt} className={`px-3 py-1.5 rounded-full text-sm border ${ (editData.settings?.visibility||"public")===opt?"bg-blue-600 text-white border-blue-500":"bg-zinc-800 text-zinc-300 border-zinc-700" }`} onClick={() => setEditData({ ...editData, settings: { ...(editData.settings||{}), visibility: opt } })}>{opt}</button>
                   ))}
                 </div>
                <select className="w-full bg-black border border-zinc-700 rounded-lg p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={editData.category || "other"} onChange={e => setEditData({ ...editData, category: e.target.value })}>
                   <option value="other">Other</option>
                   <option value="music">Music</option>
                   <option value="gaming">Gaming</option>
                   <option value="news">News</option>
                   <option value="education">Education</option>
                   <option value="travel">Travel</option>
                 </select>
               </div>
               <div className="space-y-4">
                <video src={editData.videoUrl} className="w-full rounded-lg bg-black aspect-video border border-zinc-800" controls />
                 <input className="w-full bg-black border border-zinc-700 rounded-lg p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" type="file" accept="image/*" onChange={async (e) => {
                   const f = e.target.files?.[0];
                   if (!f) return;
                   const res = await uploadVideoFile(f, setBannerProgress);
                   setEditData({ ...editData, bannerUrl: res.url });
                 }} />
               </div>
             </div>
            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900 relative z-10">
              <button className="px-4 py-2 rounded-lg bg-transparent border border-zinc-700 hover:bg-zinc-800" onClick={() => setEditData(null)}>Cancel</button>
              <button className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white" onClick={() => saveEdit(editData._id, { title: editData.title, description: editData.description, visibility: editData.settings?.visibility, category: editData.category, bannerUrl: editData.bannerUrl })}>Save</button>
             </div>
           </div>
         </div>
       )}
       {confirmId && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setConfirmId(null)}>
           <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
             <div className="text-lg font-bold mb-2">Delete Video?</div>
             <div className="text-zinc-400 text-sm mb-6">This action cannot be undone. The video will be permanently removed.</div>
             <div className="flex justify-end gap-3">
               <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors" onClick={() => setConfirmId(null)}>Cancel</button>
               <button
                 className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                 onClick={async () => {
                   const id = confirmId;
                   setConfirmId(null);
                   try {
                     await deleteVideo(id);
                     setVideos(list => list.filter(v => v._id !== id));
                     try {
                       window.dispatchEvent(new CustomEvent("video-deleted", { detail: { id } }));
                     } catch {}
                   } catch {}
                 }}
               >
                 Delete
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}

export default CreatorStudio;
