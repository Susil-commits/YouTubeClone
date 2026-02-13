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

## Deploy to Render

This repository can also be deployed to Render as a Node web service (useful if you prefer a traditional server instance instead of Vercel serverless functions).

Steps:

1. Go to https://dashboard.render.com and sign in with GitHub (or connect your Git provider).
2. Click **New** → **Web Service**.
3. Select the repository containing this project.
4. For **Name**, use `youtubeclone-backend` (or any name you prefer).
5. Set **Environment** to `Node`.
6. Set the **Build Command** to:

```
cd server && npm install --no-optional
```

7. Set the **Start Command** to:

```
cd server && npm start
```

8. Add the required environment variables in the Render dashboard:

- `MONGODB_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — secret used by the backend
- `FRONTEND_URL` — your frontend URL (Vercel URL, e.g. `https://your-app.vercel.app`)
- `ADDITIONAL_ORIGINS` — optional comma-separated extra origins

9. Enable **Auto Deploy** (optional) so Render redeploys on each push.

Health check & verification:

- Render will provide a public URL for your service (e.g. `https://youtubeclone-backend.onrender.com`).
- Verify the backend is healthy by visiting:

```
https://<your-render-url>/api/health
```

This endpoint returns a small JSON payload with `db_ready_state` and `ok` fields.

Showing your running Vercel clone (frontend + serverless):

- If you already have the project imported into Vercel, open your Vercel dashboard and select the project. The most recent deployment URL is shown in the deployment list.
- To quickly check the Vercel deployment health, open:

```
https://<your-vercel-url>/api/health
```

- From your development machine you can `curl` either endpoint:

```bash
curl -s https://<your-render-url>/api/health | jq
curl -s https://<your-vercel-url>/api/health | jq
```

Notes and tips:

- The backend already respects `process.env.PORT` and has a `start` script (`node src/index.js`), so Render will be able to start it with the `startCommand` above.
- Files uploaded to the local `server/src/uploads` folder are ephemeral on most cloud hosts; consider switching to S3 or another persistent store for production.
## Troubleshooting

-   **Frontend 404s**: If refreshing a page gives a 404, ensure the `vercel.json` "routes" section correctly points to `index.html`.
-   **Backend Errors**: Check the "Functions" logs in the Vercel dashboard.
-   **CORS Issues**: Since the frontend and backend are on the same domain, CORS issues should be minimal, but ensure `api.js` is using `/api` as the base URL.
