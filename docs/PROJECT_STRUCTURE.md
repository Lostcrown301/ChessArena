# Project Structure

```text
Chess-Arena/
|-- backend/
|   |-- drizzle/
|   |   |-- meta/
|   |   |   `-- _journal.json
|   |   |-- 0000_initial_database_layer.sql
|   |   |-- 0001_stockfish_analysis.sql
|   |   `-- 0002_gemini_coaching.sql
|   |-- scripts/
|   |   |-- check-syntax.js
|   |   |-- migrate.js
|   |   `-- seed.js
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- db/
|   |   |-- lib/
|   |   |-- middleware/
|   |   |-- repositories/
|   |   |-- routes/
|   |   |-- services/
|   |   |   |-- ai/
|   |   |   |   |-- ExplanationMapper.js
|   |   |   |   |-- GeminiService.js
|   |   |   |   `-- PromptBuilder.js
|   |   |   |-- analysis/
|   |   |   |   |-- AnalysisQueue.js
|   |   |   |   |-- EvaluationMapper.js
|   |   |   |   `-- StockfishService.js
|   |   |   `-- chess/
|   |   |       |-- ActiveGameStore.js
|   |   |       |-- ChessMapper.js
|   |   |       |-- ChessService.js
|   |   |       |-- ChessValidator.js
|   |   |       |-- GameCompletionPersistence.js
|   |   |       `-- store/
|   |   |           |-- GameStore.js
|   |   |           |-- InMemoryGameStore.js
|   |   |           |-- RedisGameStore.js
|   |   |           `-- StoreFactory.js
|   |   |-- socket/
|   |   |   |-- constants/
|   |   |   |-- handlers/
|   |   |   |-- index.js
|   |   |   |-- socket-events.js
|   |   |   `-- socket-server.js
|   |   |-- utils/
|   |   |-- app.js
|   |   `-- server.js
|   |-- .env.example
|   |-- drizzle.config.js
|   `-- package.json
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- assets/
|   |   |-- components/
|   |   |   |-- common/
|   |   |   |-- game/
|   |   |   |   |-- ai/
|   |   |   |   `-- analysis/
|   |   |   |-- layout/
|   |   |   `-- ui/
|   |   |-- config/
|   |   |-- constants/
|   |   |-- context/
|   |   |-- hooks/
|   |   |-- layouts/
|   |   |-- lib/
|   |   |-- pages/
|   |   |-- routes/
|   |   |-- services/
|   |   |   |-- api/
|   |   |   `-- socket/
|   |   |-- styles/
|   |   |-- utils/
|   |   |-- App.jsx
|   |   `-- main.jsx
|   |-- .env.example
|   |-- index.html
|   |-- package.json
|   |-- postcss.config.js
|   |-- tailwind.config.js
|   `-- vite.config.js
|-- docs/
|   |-- CHESS_ENGINE.md
|   |-- DATABASE.md
|   |-- ER_DIAGRAM.md
|   |-- FRONTEND_ARCHITECTURE.md
|   |-- GEMINI_ARCHITECTURE.md
|   |-- MULTIPLAYER.md
|   |-- PROJECT_STRUCTURE.md
|   |-- REDIS_ARCHITECTURE.md
|   |-- SOCKET_ARCHITECTURE.md
|   `-- STOCKFISH_ARCHITECTURE.md
|-- .env.example
|-- .gitignore
|-- .prettierignore
|-- .prettierrc
|-- CHANGELOG.md
|-- eslint.config.js
|-- package-lock.json
|-- package.json
`-- README.md
```

## Boundaries

- `frontend` owns browser UI, client routing, API calls, and Socket.IO client configuration.
- `backend` owns HTTP routes, middleware, Socket.IO server setup, database clients, Redis clients, and operational concerns.
- `docs` owns architecture and milestone documentation.
- Root-level files own workspace scripts, linting, formatting, and repository metadata.
