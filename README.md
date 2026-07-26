# Chess Arena

Chess Arena is a full-stack foundation for a real-time multiplayer chess platform. The backend is server-authoritative: clients request actions, while the API validates moves, owns board state, synchronizes rooms, and persists completed games.

Authentication is intentionally not implemented; players use generated UUIDs and display names.

## Features

- React/Vite frontend foundation with routing, API client, Socket.IO client, Tailwind CSS, `react-chessboard`, and `chess.js` dependencies.
- Express API with health checks, structured responses, global error handling, and 404 middleware.
- Socket.IO room lifecycle and real-time multiplayer gameplay events.
- Scalable React frontend architecture with reusable UI primitives, layouts, contexts, hooks, and service boundaries.
- Authoritative chess validation through `ChessService` and `chess.js`.
- Drizzle ORM schema for players, games, moves, and analysis.
- Active-game storage abstraction with in-memory and Redis implementations.
- Completed-game archival to PostgreSQL with placeholder analysis rows.
- Manual Stockfish position analysis through an isolated backend API.
- Gemini-powered coaching that explains Stockfish analysis without replacing it.
- Pino logging across HTTP, Socket.IO, Redis, and persistence flows.

## Architecture Overview

```text
Client
  -> REST / Socket.IO
  -> Express + Socket Handlers
  -> ChessService
  -> GameStore abstraction
     -> InMemoryGameStore for local development
     -> RedisGameStore for production active games
  -> Analysis API
     -> Stockfish engine queue
  -> AI Coaching API
     -> Gemini generateContent
  -> Neon PostgreSQL for completed games
```

Frontend deploys to Vercel. Backend deploys to Render. PostgreSQL is hosted by Neon, and Redis is hosted by Render Redis.

## Tech Stack

- Frontend: React, JavaScript, Vite, Tailwind CSS, React Router, Axios, Socket.IO Client, react-chessboard, chess.js
- Backend: Node.js, Express.js, Socket.IO, Drizzle ORM, Pino, Stockfish, Gemini API
- Data: Neon PostgreSQL, Render Redis
- Deployment: Vercel frontend, Render backend

## Repository Structure

```text
Chess-Arena/
|-- backend/
|-- frontend/
|-- docs/
|   |-- DATABASE.md
|   |-- ER_DIAGRAM.md
|   |-- CHESS_ENGINE.md
|   |-- SOCKET_ARCHITECTURE.md
|   |-- MULTIPLAYER.md
|   |-- FRONTEND_ARCHITECTURE.md
|   |-- REDIS_ARCHITECTURE.md
|   |-- STOCKFISH_ARCHITECTURE.md
|   |-- GEMINI_ARCHITECTURE.md
|   `-- PROJECT_STRUCTURE.md
|-- README.md
|-- CHANGELOG.md
|-- .env.example
|-- .gitignore
|-- .prettierrc
|-- .prettierignore
|-- eslint.config.js
|-- package.json
`-- package-lock.json
```

## Local Setup

```bash
npm install
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
npm run dev
```

Frontend: http://localhost:5173

Backend: http://localhost:4000

Health check: http://localhost:4000/api/health

Backend-only Drizzle commands:

```bash
npm run db:migrate --workspace backend
npm run db:seed --workspace backend
npm run db:studio --workspace backend
```

## Environment Variables

Use the `.env.example` files in `frontend` and `backend` as the source of truth.

Frontend:

- `VITE_API_URL`
- `VITE_SOCKET_URL`

Backend:

- `NODE_ENV`
- `PORT`
- `CORS_ORIGIN`
- `DATABASE_URL`
- `REDIS_URL`
- `GAME_STORE_DRIVER`
- `ACTIVE_GAME_TTL_SECONDS`
- `GEMINI_API_KEY`
- `GEMINI_API_ENDPOINT`
- `GEMINI_MODEL`
- `LOG_LEVEL`

For production, set `GAME_STORE_DRIVER=redis` and configure `GEMINI_API_KEY`.

## Deployment

Frontend is deployed to Vercel from the `frontend` workspace. Configure the Vercel environment variables to point to the Render backend URL.

Backend is deployed to Render from the `backend` workspace. Configure Render with the Neon `DATABASE_URL`, Render Redis `REDIS_URL`, allowed `CORS_ORIGIN`, and production logging settings.

Run Drizzle migrations against Neon before serving production traffic.

## Documentation

- [Database](./docs/DATABASE.md)
- [ER Diagram](./docs/ER_DIAGRAM.md)
- [Chess Engine](./docs/CHESS_ENGINE.md)
- [Socket Architecture](./docs/SOCKET_ARCHITECTURE.md)
- [Multiplayer](./docs/MULTIPLAYER.md)
- [Frontend Architecture](./docs/FRONTEND_ARCHITECTURE.md)
- [Redis Architecture](./docs/REDIS_ARCHITECTURE.md)
- [Stockfish Architecture](./docs/STOCKFISH_ARCHITECTURE.md)
- [Gemini Architecture](./docs/GEMINI_ARCHITECTURE.md)
- [Project Structure](./docs/PROJECT_STRUCTURE.md)
