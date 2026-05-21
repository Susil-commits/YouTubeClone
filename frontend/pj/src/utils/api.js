import axios from "axios";

// In production on Vercel, frontend calls the Render backend.
// In dev, use the configured VITE_API_URL or fall back to the Render backend.
const rawApi = import.meta.env.VITE_API_URL;
let API_BASE = null;

if (rawApi) {
  API_BASE = rawApi.replace(/\/$/, "");
  if (!API_BASE.endsWith("/api")) API_BASE = API_BASE + "/api";
} else if (import.meta.env.DEV) {
  API_BASE = "https://youtubeclone-5hae.onrender.com/api";
} else {
  // Production on Vercel: point to the Render backend
  API_BASE = "https://youtubeclone-5hae.onrender.com/api";
}

export { API_BASE };

// Configure axios global defaults so cookies are sent to the backend when API_BASE exists
if (API_BASE) {
  axios.defaults.baseURL = API_BASE;
}
axios.defaults.withCredentials = true;

function buildUrl(path) {
  if (!API_BASE) {
    const msg =
      "Missing VITE_API_URL: cannot build API URL in production. Set VITE_API_URL to your Render backend domain.";
    console.error(msg);
    throw new Error(msg);
  }
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

function baseHeaders(admin = false) {
  return {
    "Content-Type": "application/json",
    ...(admin ? { "x-admin": "true" } : {})
  };
}

export async function fetchPublicVideos(category) {
  const res = await fetch(buildUrl(`/videos?category=${encodeURIComponent(category || "")}`));
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function fetchMyVideos(category) {
  const res = await fetch(buildUrl(`/videos?category=${encodeURIComponent(category || "")}`), {
    headers: { ...baseHeaders() }
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function fetchAllVideosAdmin(category) {
  const res = await fetch(buildUrl(`/videos?category=${encodeURIComponent(category || "")}`), {
    headers: { ...baseHeaders(true) }
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function createVideo(payload) {
  const res = await fetch(buildUrl(`/videos`), {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function updateVideo(id, payload) {
  const res = await fetch(buildUrl(`/videos/${id}`), {
    method: "PATCH",
    headers: baseHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function adminMuteOverride(id, value) {
  const res = await fetch(buildUrl(`/admin/videos/${id}/mute-override`), {
    method: "PATCH",
    headers: baseHeaders(true),
    body: JSON.stringify({ adminMuteOverride: value })
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function adminSetApproved(id, value) {
  const res = await fetch(buildUrl(`/admin/videos/${id}/approve`), {
    method: "PATCH",
    headers: baseHeaders(true),
    body: JSON.stringify({ isApproved: value })
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function adminSetVisibility(id, visibility) {
  const res = await fetch(buildUrl(`/admin/videos/${id}/visibility`), {
    method: "PATCH",
    headers: baseHeaders(true),
    body: JSON.stringify({ visibility })
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function uploadVideoFile(file, onProgress) {
  const form = new FormData();
  form.append("file", file);

  const res = await axios.post(buildUrl(`/upload`), form, {
    headers: {
      "Content-Type": "multipart/form-data"
    },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    }
  });
  return res.data;
}

export async function uploadLogoFile(file, onProgress) {
  const form = new FormData();
  form.append("file", file);

  const res = await axios.post(buildUrl(`/auth/upload-logo`), form, {
    headers: {
      "Content-Type": "multipart/form-data"
    },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    }
  });
  return res.data;
}

export async function deleteVideo(id) {
  const res = await fetch(buildUrl(`/videos/${id}`), {
    method: "DELETE",
    headers: baseHeaders()
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function adminDeleteVideo(id) {
  const res = await fetch(buildUrl(`/admin/videos/${id}`), {
    method: "DELETE",
    headers: baseHeaders(true)
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function recordView(id) {
  const res = await fetch(buildUrl(`/videos/${id}/view`), {
    method: "POST",
    headers: baseHeaders()
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function fetchNotifications() {
  const res = await fetch(buildUrl(`/auth/notifications`), {
    headers: baseHeaders()
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function fetchComments(videoId) {
  const res = await fetch(buildUrl(`/videos/${videoId}/comments`), {
    headers: baseHeaders()
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function postComment(videoId, text) {
  const res = await fetch(buildUrl(`/videos/${videoId}/comments`), {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}
