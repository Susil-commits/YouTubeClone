import axios from "axios";
const rawApi = "https://youtubeclone-d2s7.onrender.com";
let API_BASE = null;
if (rawApi) {
  API_BASE = rawApi.replace(/\/$/, "");
  if (!API_BASE.endsWith("/api")) API_BASE = API_BASE + "/api";
} else if (import.meta.env.DEV) {
  API_BASE = "https://youtubeclone-5hae.onrender.com/api";
} else {
  // In production we must not silently fall back to a relative /api.
  console.error(
    "VITE_API_URL is not set. Please set VITE_API_URL=https://<your-backend> in Vercel environment variables."
  );
  API_BASE = null;
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
  if (!path.startsWith("/")) path = "/" + path;
  return `${API_BASE}${path}`;
}

function getUserId() {
  return localStorage.getItem("userId") || "64c9f0f0f0f0f0f0f0f0f0f0";
}

function baseHeaders(admin = false) {
  return {
    "Content-Type": "application/json",
    "x-user-id": getUserId(),
    "x-admin": admin ? "true" : "false",
  };
}

export async function fetchPublicVideos(category) {
  const qs = category && category !== "All" ? `?category=${encodeURIComponent(category.toLowerCase())}` : "";
  const res = await fetch(buildUrl(`/videos${qs}`), { headers: baseHeaders(false), credentials: 'include' });
  return res.json();
}

export async function fetchMyVideos(category) {
  const qs = category && category !== "All" ? `&category=${encodeURIComponent(category.toLowerCase())}` : "";
  const res = await fetch(buildUrl(`/videos?mine=1${qs}`), { headers: baseHeaders(false), credentials: 'include' });
  return res.json();
}

export async function fetchAllVideosAdmin(category) {
  const qs = category && category !== "All" ? `?category=${encodeURIComponent(category.toLowerCase())}` : "";
  const res = await fetch(buildUrl(`/videos${qs}`), { headers: baseHeaders(true), credentials: 'include' });
  return res.json();
}

export async function createVideo(payload) {
  const res = await fetch(buildUrl(`/videos`), {
    method: "POST",
    headers: baseHeaders(false),
    body: JSON.stringify(payload),
    credentials: 'include'
  });
  return res.json();
}

export async function updateVideo(id, payload) {
  const res = await fetch(buildUrl(`/videos/${id}`), {
    method: "PATCH",
    headers: baseHeaders(false),
    body: JSON.stringify(payload),
    credentials: 'include'
  });
  return res.json();
}

export async function adminMuteOverride(id, value) {
  const res = await fetch(buildUrl(`/admin/videos/${id}/mute-override`), {
    method: "PATCH",
    headers: baseHeaders(true),
    body: JSON.stringify({ adminMuteOverride: value }),
    credentials: 'include'
  });
  return res.json();
}

export async function adminSetApproved(id, value) {
  const res = await fetch(buildUrl(`/admin/videos/${id}/approve`), {
    method: "PATCH",
    headers: baseHeaders(true),
    body: JSON.stringify({ isApproved: value }),
    credentials: 'include'
  });
  return res.json();
}

export async function adminSetVisibility(id, visibility) {
  const res = await fetch(buildUrl(`/admin/videos/${id}/visibility`), {
    method: "PATCH",
    headers: baseHeaders(true),
    body: JSON.stringify({ visibility }),
    credentials: 'include'
  });
  return res.json();
}

export async function uploadVideoFile(file, onProgress) {
  const form = new FormData();
  form.append("file", file);
  const res = await axios.post(buildUrl(`/upload`), form, {
    headers: {
      "x-user-id": getUserId(),
      "x-admin": "false"
    },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    }
  });
  return res.data;
}

export async function uploadLogoFile(file, onProgress) {
  const form = new FormData();
  form.append("file", file);
  const res = await axios.post(buildUrl(`/auth/upload-logo`), form, {
    headers: {
      "x-user-id": getUserId(),
      "x-admin": "false"
    },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    }
  });
  return res.data;
}

export async function deleteVideo(id) {
  const res = await fetch(buildUrl(`/videos/${id}`), {
    method: "DELETE",
    headers: baseHeaders(false),
    credentials: 'include'
  });
  return res.json();
}

export async function adminDeleteVideo(id) {
  const res = await fetch(buildUrl(`/admin/videos/${id}`), {
    method: "DELETE",
    headers: baseHeaders(true),
    credentials: 'include'
  });
  return res.json();
}

export async function recordView(id) {
  const res = await fetch(buildUrl(`/videos/${id}/view`), {
    method: "POST",
    headers: baseHeaders(false),
    credentials: 'include'
  });
  return res.json();
}

export async function fetchNotifications() {
  const res = await fetch(buildUrl(`/auth/notifications`), {
    headers: baseHeaders(false),
    credentials: 'include'
  });
  return res.json();
}

export async function fetchComments(videoId) {
  const res = await fetch(buildUrl(`/videos/${videoId}/comments`), {
    headers: baseHeaders(false),
    credentials: 'include'
  });
  return res.json();
}

export async function postComment(videoId, text) {
  const res = await fetch(buildUrl(`/videos/${videoId}/comments`), {
    method: "POST",
    headers: baseHeaders(false),
    body: JSON.stringify({ text }),
    credentials: 'include'
  });
  return res.json();
}
