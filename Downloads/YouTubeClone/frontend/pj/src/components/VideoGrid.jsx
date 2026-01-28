import { useEffect, useMemo, useRef, useState } from "react";
import { fetchPublicVideos } from "../utils/api";
import VideoCard from "./VideoCard";
import { ChevronLeftIcon, ChevronRightIcon, ArrowUpIcon } from "@heroicons/react/24/outline";

function VideoGrid({ searchTerm, onOpen }) {
  const [videos, setVideos] = useState([]);
  const [chip, setChip] = useState("All");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const chipsRef = useRef(null);
  const gridRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    fetchPublicVideos(chip)
      .then((list) => setVideos(list))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, [chip]);
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
  useEffect(() => {
    const el = chipsRef.current;
    const update = () => {
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 1);
    };
    update();
    el?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      el?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  useEffect(() => {
    const grid = gridRef.current;
    const onScroll = () => {
      if (!grid) return;
      setShowScrollTop(grid.scrollTop > 160);
    };
    onScroll();
    grid?.addEventListener("scroll", onScroll);
    return () => grid?.removeEventListener("scroll", onScroll);
  }, []);
  const chips = ["All", "Music", "Gaming", "Comedy", "Movies", "Tech", "Travel"];
  const filtered = useMemo(() => {
    const q = (searchTerm || "").trim().toLowerCase();
    // Filter out private videos (admin hidden)
    const publicVideos = videos.filter(v => v.settings?.visibility !== "private");
    const base = q ? publicVideos.filter((v) => String(v.title || "").toLowerCase().includes(q)) : publicVideos;
    return base.slice(0, page * pageSize);
  }, [videos, searchTerm, page]);
  return (
    <div className="flex-1 flex flex-col pt-2">
      <div className="sticky top-0 bg-bg z-10 relative">
        <div ref={chipsRef} className="chips pl-16 pr-16">
          {chips.map((c) => (
            <button
              key={c}
              className={`chip ${chip === c ? "active" : ""}`}
              onClick={() => {
                setLoading(true);
                setPage(1);
                setChip(c);
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-bg to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-bg to-transparent" />
        {canScrollLeft && (
          <div className="absolute inset-y-0 left-2 flex items-center">
            <button
              className="bg-black/30 text-zinc-100 p-1.5 rounded-full border border-white/10 hover:bg-black/50 shadow-sm"
              aria-label="Scroll chips left"
              onClick={() => chipsRef.current?.scrollBy({ left: -200, behavior: "smooth" })}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        {canScrollRight && (
          <div className="absolute inset-y-0 right-2 flex items-center">
            <button
              className="bg-black/30 text-zinc-100 p-1.5 rounded-full border border-white/10 hover:bg-black/50 shadow-sm"
              aria-label="Scroll chips right"
              onClick={() => chipsRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <div className="video-grid" ref={gridRef}>
        {loading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="video-card">
              <div className="thumb animate-pulse bg-zinc-800" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-zinc-800 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        {filtered.map((v) => (
          <VideoCard key={v._id} video={v} onOpen={onOpen} />
        ))}
      </div>
      {!loading && filtered.length < videos.length && (
        <div className="flex justify-center p-4">
          <button className="btn" onClick={() => setPage((p) => p + 1)}>Load More</button>
        </div>
      )}
      {showScrollTop && (
        <div className="fixed right-4 bottom-4">
          <button
            className="bg-black/40 text-zinc-100 p-2 rounded-full border border-white/10 hover:bg-black/60 shadow-sm"
            aria-label="Scroll to top"
            title="Scroll to top"
            onClick={() => {
              if (gridRef.current) gridRef.current.scrollTo({ top: 0, behavior: "smooth" });
              else window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <ArrowUpIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default VideoGrid;
