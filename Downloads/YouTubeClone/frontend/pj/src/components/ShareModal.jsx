import { motion } from "framer-motion";
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

function ShareModal({ url, title, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-lg font-medium text-white">Share</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {/* Social Share Mock Buttons */}
            {['WhatsApp', 'Facebook', 'Twitter', 'Email', 'Reddit'].map(platform => (
              <button key={platform} className="flex flex-col items-center gap-2 min-w-[64px] group">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-xl group-hover:bg-zinc-700 transition-colors">
                  {platform[0]}
                </div>
                <span className="text-xs text-zinc-400">{platform}</span>
              </button>
            ))}
          </div>

          <div className="bg-black/40 rounded-lg p-3 border border-zinc-700/50 flex items-center gap-3">
            <div className="flex-1 min-w-0">
               <div className="text-xs text-zinc-500 mb-1">Page Link</div>
               <div className="text-sm text-zinc-300 truncate">{url}</div>
            </div>
            <button 
              onClick={handleCopy}
              className="btn-secondary text-sm px-3 py-1.5 h-auto shrink-0 flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-4 w-4 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <ClipboardDocumentIcon className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ShareModal;
