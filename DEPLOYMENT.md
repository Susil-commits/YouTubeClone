# Vercel Deployment Guide

This project is configured to be deployed as a monorepo on Vercel, with the Node.js backend running as Serverless Functions and the React frontend as static assets.

## Prerequisites

1.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
2.  **Vercel CLI** (optional): Install via `npm i -g vercel`.
3.  **MongoDB Atlas**: You need a cloud-hosted MongoDB database (e.g., MongoDB Atlas) since the local database won't work in the cloud.

## Important Limitations

-   **File Uploads**: This application currently stores uploaded videos and images on the local filesystem (`server/src/uploads`). **On Vercel, the filesystem is ephemeral (temporary).**
    -   Files uploaded will **disappear** after a short time.
    -   **Solution**: For a production app, you must update the backend to upload files to a cloud storage service like **AWS S3**, **Cloudinary**, or **Firebase Storage**.

## Deployment Steps

### 1. Push to GitHub
Push your code to a GitHub repository.

### 2. Import into Vercel
1.  Go to your Vercel Dashboard.
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your GitHub repository.

### 3. Configure Project
Vercel should automatically detect the `vercel.json` configuration.
-   **Framework Preset**: Leave as "Other" or default (Vercel will use the configuration in `vercel.json`).
-   **Root Directory**: Keep it as `./` (the project root).

### 4. Environment Variables
In the "Environment Variables" section, add the following:

| Variable | Description |
| :--- | :--- |
| `MONGODB_URI` | Your MongoDB Atlas connection string (e.g., `mongodb+srv://...`). |
| `JWT_SECRET` | A secure random string for authentication. |
| `VITE_API_URL` | Set this to `/api` so the frontend calls the backend on the same domain. |

### 5. Deploy
Click **"Deploy"**. Vercel will:
1.  Build the frontend (`npm run build` in `frontend/pj`).
2.  Deploy the backend as a serverless function (`server/src/index.js`).

## Troubleshooting

-   **Frontend 404s**: If refreshing a page gives a 404, ensure the `vercel.json` "routes" section correctly points to `index.html`.
-   **Backend Errors**: Check the "Functions" logs in the Vercel dashboard.
-   **CORS Issues**: Since the frontend and backend are on the same domain, CORS issues should be minimal, but ensure `api.js` is using `/api` as the base URL.
