import axios from "axios";
const API_BASE = "http://localhost:4000/api";

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
  const res = await fetch(`${API_BASE}/videos${qs}`, { headers: baseHeaders(false) });
  return res.json();
}

export async function fetchMyVideos(category) {
  const base = `${API_BASE}/videos?mine=1`;
  const url = category && category !== "All" ? `${base}&category=${encodeURIComponent(category.toLowerCase())}` : base;
  const res = await fetch(url, { headers: baseHeaders(false) });
  return res.json();
}

export async function fetchAllVideosAdmin(category) {
  const qs = category && category !== "All" ? `?category=${encodeURIComponent(category.toLowerCase())}` : "";
  const res = await fetch(`${API_BASE}/videos${qs}`, { headers: baseHeaders(true) });
  return res.json();
}

export async function createVideo(payload) {
  const res = await fetch(`${API_BASE}/videos`, {
    method: "POST",
    headers: baseHeaders(false),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateVideo(id, payload) {
  const res = await fetch(`${API_BASE}/videos/${id}`, {
    method: "PATCH",
    headers: baseHeaders(false),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function adminMuteOverride(id, value) {
  const res = await fetch(`${API_BASE}/admin/videos/${id}/mute-override`, {
    method: "PATCH",
    headers: baseHeaders(true),
    body: JSON.stringify({ adminMuteOverride: value }),
  });
  return res.json();
}

export async function adminSetApproved(id, value) {
  const res = await fetch(`${API_BASE}/admin/videos/${id}/approve`, {
    method: "PATCH",
    headers: baseHeaders(true),
    body: JSON.stringify({ isApproved: value }),
  });
  return res.json();
}

export async function adminSetVisibility(id, visibility) {
  const res = await fetch(`${API_BASE}/admin/videos/${id}/visibility`, {
    method: "PATCH",
    headers: baseHeaders(true),
    body: JSON.stringify({ visibility }),
  });
  return res.json();
}

export async function uploadVideoFile(file, onProgress) {
  const form = new FormData();
  form.append("file", file);
  const res = await axios.post(`${API_BASE}/upload`, form, {
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
  const res = await axios.post(`${API_BASE}/auth/upload-logo`, form, {
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
  const res = await fetch(`${API_BASE}/videos/${id}`, {
    method: "DELETE",
    headers: baseHeaders(false)
  });
  return res.json();
}

export async function adminDeleteVideo(id) {
  const res = await fetch(`${API_BASE}/admin/videos/${id}`, {
    method: "DELETE",
    headers: baseHeaders(true)
  });
  return res.json();
}

export async function recordView(id) {
  const res = await fetch(`${API_BASE}/videos/${id}/view`, {
    method: "POST",
    headers: baseHeaders(false)
  });
  return res.json();
}

export async function fetchNotifications() {
  const res = await fetch(`${API_BASE}/auth/notifications`, {
    headers: baseHeaders(false)
  });
  return res.json();
}
