# Environment Configuration

This document outlines every environment variable used in the Chess Arena platform.

The goal of this configuration is to ensure the repository can be cloned, configured, and run with minimal effort by duplicating the `.env.example` files.

---

## Backend Environment Variables

Located in `backend/.env`.

### Application

| Variable    | Required | Default       | Description                                                                                                                                 |
| :---------- | :------: | :------------ | :------------------------------------------------------------------------------------------------------------------------------------------ |
| `NODE_ENV`  |   Yes    | `development` | Defines the environment. Setting this to `production` disables Express stack traces, enables JSON logging, and enforces strict validations. |
| `PORT`      |    No    | `4000`        | The port the Express API binds to. Render sets this automatically in production.                                                            |
| `LOG_LEVEL` |    No    | `info`        | Minimum log severity to record (`fatal`, `error`, `warn`, `info`, `debug`, `trace`).                                                        |

### Security

| Variable      | Required | Default                 | Description                                                                                                                        |
| :------------ | :------: | :---------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| `CORS_ORIGIN` |   Yes*   | `http://localhost:5173` | A comma-separated list of allowed origins. _Required in production_. Must exactly match the frontend URL without trailing slashes. |

### Database (PostgreSQL)

| Variable       | Required | Default            | Description                                                                                                               |
| :------------- | :------: | :----------------- | :------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL` |    No    | `postgresql://...` | Connection string for the Neon database. Required for historical data and analysis archiving. Obtain from Neon dashboard. |

### Redis (Pub/Sub & Caching)

| Variable                  | Required | Default                  | Description                                                                                                          |
| :------------------------ | :------: | :----------------------- | :------------------------------------------------------------------------------------------------------------------- |
| `REDIS_URL`               |    No    | `redis://localhost:6379` | Connection string for Redis. Required if `GAME_STORE_DRIVER=redis`. Obtain from Render Redis dashboard.              |
| `GAME_STORE_DRIVER`       |    No    | `memory`                 | The active gameplay state driver (`memory` or `redis`). Must be `redis` in production to support horizontal scaling. |
| `ACTIVE_GAME_TTL_SECONDS` |    No    | `3600`                   | Time-to-live for an active game in seconds.                                                                          |

### AI (Gemini)

| Variable              | Required | Default              | Description                                                                                                              |
| :-------------------- | :------: | :------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY`      |    No    | _(empty)_            | Google Gemini API key for post-game coaching. If empty, coaching degrades gracefully to Stockfish-only development mode. |
| `GEMINI_API_ENDPOINT` |    No    | `https://.../v1beta` | Override the Google generative language API endpoint (useful for enterprise proxies).                                    |
| `GEMINI_MODEL`        |    No    | `gemini-2.0-flash`   | The specific model string to use for coaching generations.                                                               |

---

## Frontend Environment Variables

Located in `frontend/.env`.

| Variable          | Required | Default                     | Description                                                                                   |
| :---------------- | :------: | :-------------------------- | :-------------------------------------------------------------------------------------------- |
| `VITE_APP_NAME`   |    No    | `Chess Arena`               | Application display name.                                                                     |
| `VITE_API_URL`    |   Yes    | `http://localhost:4000/api` | The HTTP URL of the backend REST API. In production, points to the Render web service `/api`. |
| `VITE_SOCKET_URL` |   Yes    | `http://localhost:4000`     | The WebSocket URL for Socket.IO. In production, points to the Render web service root.        |

---

## Example Setup Workflow

1. Clone the repository.
2. Setup backend: `cd backend && cp .env.example .env && npm install`
3. Setup frontend: `cd frontend && cp .env.example .env && npm install`
4. (Optional) Replace `GEMINI_API_KEY` and `DATABASE_URL` in `backend/.env` with your credentials.
5. Run `npm run dev` in `backend/` and `frontend/` directories to start each server.
