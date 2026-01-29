# MyTube – Premium YouTube Clone (Frontend)

A refined, premium‑styled React + Vite frontend delivering a modern video experience with elegant UI, smooth animations, and responsive performance. Built with Tailwind CSS, Heroicons, and motion enhancements for a polished feel across pages.

## Overview
- Fast, responsive interface powered by Vite and React.
- Premium visual language: subtle shadows, rounded surfaces, gradient accents.
- Seamless creator workflow: upload, preview, publish, and manage videos.
- Engaging watch experience with custom controls and related content.

## Key Features
- Home, Trending, Subscriptions, Library views with optimized grids.
- Creator Studio for uploading, editing, setting visibility and categories.
- Watch Page with custom player overlay, progress seeking, and share actions.
- Authentication modal supporting register/sign‑in and logo upload.
- Admin moderation hooks for approval, visibility, and notifications.

## Tech Stack
- Frontend: React, Vite, Tailwind CSS, Heroicons, Framer Motion, React Dropzone
- Backend (used by this UI): Express, Mongoose, Multer, static uploads under `/uploads`
- Auth endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/upload-logo`
- Videos API: `/api/videos` create/list/update/delete, `/api/upload` for file uploads

## Screenshots
Place your screenshots at the paths below. These are dummy placeholders you can replace with your actual assets.

### Home Page
![Home](assets/Home.png)

### Login Page
![Login](assets/LOG.png)

### Saved Page
![Saved](assets/saved.png)

## Getting Started
- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Lint code: `npm run lint`

## Usage Notes
- Ensure the backend server is running at `http://localhost:4000` for API calls.
- Store `userId`, `userName`, and `userLogo` in `localStorage` after successful auth for creator features.
- Video uploads use `/api/upload` with size/type validation; provide a valid MP4/WEBM under server limits.

## Premium UX Highlights
- Cursor affordances and focused hover states on clickable controls.
- Smooth component transitions and micro‑interactions for a polished feel.
- Accessible forms with clear focus rings and keyboard submission.
