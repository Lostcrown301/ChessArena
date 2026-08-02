# Chess Arena

![Chess Arena Header](https://via.placeholder.com/1200x300?text=Chess+Arena+-+Realtime+Multiplayer+Chess)

A production-quality, full-stack foundation for a real-time multiplayer chess platform.

The application uses a server-authoritative architecture where clients request actions, but the API validates moves, owns the board state, synchronizes rooms, and persists completed games.

## Why this project?

Chess Arena was built to demonstrate how to seamlessly orchestrate complex state across multiple specialized backend services (Redis, PostgreSQL, Stockfish, Gemini AI) while serving a highly interactive React/Vite frontend over WebSockets. It serves as a comprehensive reference architecture for real-time multiplayer game development in Node.js.

## Features

- **Real-time Multiplayer:** Instant, low-latency move broadcasting and room management via Socket.IO.
- **Server-Authoritative Validation:** The backend strictly enforces rules using `chess.js`, preventing any client-side cheating.
- **AI Coaching:** Post-game human-readable analysis powered by Google's Gemini, combined with precise Stockfish 16.1 engine evaluations.
- **Scalable Architecture:** Designed with stateless Node processes, delegating active game state to Redis for horizontal scalability.
- **Production Hardened:** Implements rate-limiting, Helmet security headers, strict CORS, crash recovery, and request tracing.
- **Beautiful UI:** Polished, responsive React frontend built with Tailwind CSS, `react-chessboard`, and accessible component primitives.

## Architecture Overview

Chess Arena utilizes a micro-service-like separation of concerns within a monolithic repository.

1. **Frontend:** React application communicating via standard HTTP (for history/auth) and Socket.IO (for gameplay).
2. **Backend:** Express API and Socket.IO server handling business logic.
3. **Data Layer:**
   - **Redis:** Manages ephemeral, high-speed active game state.
   - **PostgreSQL:** Archives completed games and history (managed via Drizzle ORM).
4. **Analysis Layer:**
   - **Stockfish:** Isolated queue-based service for raw positional evaluation.
   - **Gemini:** AI service that transforms Stockfish data into natural language coaching.

For more details, see the [Architecture Documentation](./docs/ARCHITECTURE.md).

## Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Socket.IO Client, `react-chessboard`
- **Backend:** Node.js, Express.js 5, Socket.IO, Pino (Logging)
- **Database / ORM:** Neon PostgreSQL, Drizzle ORM, Render Redis
- **Engines / AI:** Stockfish 16.1 (WASM/Node), Google Gemini 2.0 API
- **Deployment:** Vercel (Frontend), Render (Backend/Redis)

## Folder Structure

```text
Chess-Arena/
├── backend/                  # Independent Express API, Socket server, and services
│   ├── drizzle/              # Database migrations
│   ├── src/                  # Application source code
│   ├── package.json          # Backend dependencies and scripts
│   └── ...
├── frontend/                 # Independent React SPA
│   ├── src/                  # React source code
│   ├── package.json          # Frontend dependencies and scripts
│   └── ...
├── docs/                     # Architectural and API documentation
├── .env.example
├── .gitignore
├── CHANGELOG.md
└── README.md
```

## Screenshots

> _Replace these placeholders with actual screenshots of the application running._

|                             Lobby                             |                          Active Game                          |                           Game Review                           |
| :-----------------------------------------------------------: | :-----------------------------------------------------------: | :-------------------------------------------------------------: |
| ![Lobby](https://via.placeholder.com/400x300?text=Lobby+View) | ![Game](https://via.placeholder.com/400x300?text=Active+Game) | ![Review](https://via.placeholder.com/400x300?text=Game+Review) |

---

## Local Development Setup

To run Chess Arena locally, you need Node.js (v20+), npm (v10+), and a local or cloud Redis/Postgres instance.

### 1. Backend Setup

Navigate to the `backend` folder, install dependencies, and copy the environment configuration:

```bash
cd backend
npm install
cp .env.example .env
```

Ensure you have a PostgreSQL database and a Redis server running.

### 2. Frontend Setup

In a separate terminal, navigate to the `frontend` folder, install dependencies, and copy the environment configuration:

```bash
cd frontend
npm install
cp .env.example .env
```

### 3. PostgreSQL Setup

The application uses Drizzle ORM. Configure your `DATABASE_URL` in `backend/.env`, then run migrations from the `backend/` directory:

```bash
cd backend
npm run db:migrate
```

### 4. Redis Setup

Ensure a local Redis instance is running on port `6379`, or provide a cloud connection string in `REDIS_URL`. Redis is required if you set `GAME_STORE_DRIVER=redis`. (For local development without Redis, you can use `GAME_STORE_DRIVER=memory`).

### 5. Stockfish Setup

Stockfish is bundled as a WebAssembly/Node module via `stockfish.js`. No external binaries need to be installed. It initializes automatically when the backend starts.

### 6. Gemini Setup

To enable AI coaching, obtain an API key from Google AI Studio and set `GEMINI_API_KEY` in `backend/.env`. If left blank, the application degrades gracefully and relies solely on raw Stockfish evaluations.

### 7. Starting the Application

Start the backend and frontend separately in their respective directories:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000
- **Health Check:** http://localhost:4000/api/health

---

## Environment Variables

The project uses `.env` files inside `backend/` and `frontend/` for configuration. A complete audit of all environment variables can be found in the [Environment Documentation](./docs/ENVIRONMENT.md).

---

## Available npm Scripts

**Backend (`cd backend`):**

- `npm run dev`: Starts the backend server with nodemon reloading.
- `npm run start`: Runs the production backend server (`node src/server.js`).
- `npm run build`: Runs syntax verification checks.
- `npm run lint`: Runs ESLint on backend code.
- `npm run format`: Formats backend files with Prettier.
- `npm run db:migrate`: Applies Drizzle SQL migrations to PostgreSQL.
- `npm run db:studio`: Opens Drizzle Studio visual database editor.

**Frontend (`cd frontend`):**

- `npm run dev`: Starts Vite dev server.
- `npm run build`: Compiles the frontend for production (`dist/`).
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Runs ESLint on frontend code.
- `npm run format`: Formats frontend files with Prettier.

---

## Deployment Overview

Chess Arena is designed for PaaS platforms like Vercel and Render.

- **Frontend:** Deploy the `frontend/` directory to **Vercel** as a Vite project.
- **Backend:** Deploy the `backend/` directory to **Render** as a Node Web Service.
- **Infrastructure:** Use Neon for serverless PostgreSQL and Render Redis for the cache layer.

For step-by-step instructions, see the [Deployment Guide](./docs/DEPLOYMENT.md) and [Production Checklist](./docs/PRODUCTION_CHECKLIST.md).

For project-defense preparation, see the [Interview Preparation Handbook](./docs/INTERVIEW_PREPARATION.md).

---

## Troubleshooting

- **Socket Connection Fails:** Ensure `VITE_SOCKET_URL` in `frontend/.env` exactly matches the backend root URL without any path (e.g., `http://localhost:4000`).
- **CORS Errors:** In production, ensure `CORS_ORIGIN` in `backend/.env` exactly matches your frontend domain, without trailing slashes.
- **Games not saving:** Ensure `DATABASE_URL` is correct and you have run `npm run db:migrate`.
- **"Gemini Unavailable" in Review:** Verify your `GEMINI_API_KEY` is correct and has not exceeded quota limits.

---

## Known Limitations

- **Authentication:** There is no persistent user authentication. Players are assigned ephemeral UUIDs in local storage.
- **Redis Persistence:** If using a free-tier ephemeral Redis instance, active games will be lost if the Redis server restarts.

---

## Future Roadmap

- OAuth 2.0 / JWT persistent authentication.
- ELO rating system and matchmaking queues.
- PGN export and import functionality.
- Spectator mode for high-profile active games.
- Real-time chat within game rooms.
