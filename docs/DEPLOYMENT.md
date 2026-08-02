# Deployment Guide

This document outlines the steps required to deploy Chess Arena to its production environment.

## Infrastructure Stack

- **Frontend**: Vercel
- **Backend**: Render (Web Service)
- **Database**: Neon (Serverless PostgreSQL)
- **Cache / PubSub**: Render Redis

---

## 1. Prerequisites

- A GitHub repository containing the Chess Arena codebase.
- Accounts for Vercel, Render, and Neon.

---

## 2. Database Setup (Neon)

1. Log in to Neon and create a new project.
2. Navigate to your project dashboard and copy the **Connection String** (e.g., `postgresql://...`).
3. (Optional) Run the database migrations locally pointing to your Neon instance to initialize the schema:
   ```bash
   DATABASE_URL="your-neon-url" npm run db:migrate
   ```

---

## 3. Redis Setup (Render)

1. Log in to Render.
2. Click **New +** and select **Redis**.
3. Provide a name (e.g., `chess-arena-redis`).
4. Select your preferred region and instance size (Free tier works for development/small production).
5. Copy the **Internal Redis URL** for the backend service (if both are on Render) or **External Redis URL** if needed.

---

## 4. Backend Deployment (Render)

1. In Render, click **New +** and select **Web Service**.
2. Connect your GitHub repository.
3. Configure the following:
   - **Environment**: Node
   - **Build Command**: `npm install` (Note: we don't have a specific build step for backend, but dependencies must be installed).
   - **Start Command**: `npm start`
4. Expand **Advanced** and add the following Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `4000` (or leave blank, Render provides this)
   - `DATABASE_URL`: _(Your Neon Connection String)_
   - `REDIS_URL`: _(Your Render Redis Internal URL)_
   - `CORS_ORIGIN`: `https://your-frontend-domain.vercel.app`
   - `GEMINI_API_KEY`: _(Your Google AI API Key)_
5. Click **Create Web Service**. Render will automatically provision HTTPS.

---

## 5. Frontend Deployment (Vercel)

1. Log in to Vercel and click **Add New...** -> **Project**.
2. Import the Chess Arena GitHub repository.
3. Expand **Build and Output Settings** and ensure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   - `VITE_API_URL`: `https://your-backend-app.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://your-backend-app.onrender.com`
5. Ensure the Root Directory in Vercel is set to `frontend/`.
6. Click **Deploy**. Vercel will build and host the static assets.

---

## 6. Troubleshooting

- **CORS Errors**: Ensure the backend `CORS_ORIGIN` exactly matches your deployed Vercel domain (without trailing slashes).
- **Socket Disconnections**: Vercel does not host websockets. Websockets run on the Render backend. Ensure `VITE_SOCKET_URL` points directly to Render.
- **API 503 Errors**: Check the `/api/health/ready` endpoint. If PostgreSQL or Redis is unreachable, Render logs will indicate connection timeouts.
- **Gemini Unavailable**: If Gemini is down or the API key is missing, AI caching/fallback will degrade gracefully without bringing down the app.
