# Changelog

## Unreleased

### Changed

- Reviewed and hardened the Milestone 3 backend chess engine.
- Kept controllers limited to HTTP request/response concerns.
- Moved active game creation behind `ActiveGameStore.createGame()` so the store can be replaced later without changing `ChessService`.
- Centralized terminal game statuses and kept move timestamps stable through mapping.
- Standardized fallback API error responses to the `{ success, error }` envelope.
- Reviewed and hardened the Milestone 4 Socket.IO infrastructure.
- Made Socket.IO initialization injectable while preserving the existing server integration point.
- Added RoomManager input validation for room IDs, socket IDs, and room capacity.
- Clarified reconnect behavior in the socket architecture documentation.
- Reviewed and hardened Milestone 5 multiplayer gameplay without adding future milestone scope.
- Centralized gameplay broadcast success payloads on the shared socket response helper.
- Prevented overlapping draw offers and kept black player runtime metadata consistent with white player metadata.
- Reordered reconnect handling so room restoration completes before player presence is marked connected.
- Replaced direct ChessService access to the in-memory active-game map with the GameStore abstraction.
- Added Redis active-game storage with JSON serialization, rehydration, TTL refresh, and cleanup on game completion.
- Added PostgreSQL persistence for completed games, move history, and placeholder analysis rows.
- Updated socket room and gameplay handlers to await asynchronous active-game storage.
- Reviewed and hardened Milestone 6 Redis storage without adding future milestone scope.
- Added stricter Redis snapshot validation so corrupted active-game data returns structured store errors.
- Wrapped completed-game PostgreSQL archival in a transaction and made Redis cleanup failure non-blocking after successful archival.
- Expanded Redis store logging for existence checks, list operations, and clear failures.
- Removed container deployment artifacts and scripts because deployment targets are Vercel, Render, Neon, and Render Redis.
- Moved architecture documentation into `docs/` and refreshed repository documentation for frontend development.
- Added the React frontend architecture foundation with reusable components, layouts, contexts, hooks, API client setup, and lazy Socket.IO client setup.
- Added the lobby experience with player-name persistence, create/join game API calls, loading and error states, navigation to the game placeholder, and socket lifecycle wiring on the game route.
- Added the visual-only Game UI with a responsive `react-chessboard`, player panels, move history, captured-piece placeholders, status panels, game controls, and clipboard feedback.
- Connected the frontend Game page to backend Socket.IO state with player-session persistence, live FEN rendering, move submission, draw/resign controls, reconnect recovery, and server-confirmed game updates.
- Added isolated Stockfish analysis with queued backend evaluation, `/api/analysis`, final-position analysis persistence fields, and a manual frontend Analysis panel.
- Added Gemini AI coaching with `/api/ai/explain`, prompt/context mapping, cached persisted explanations, frontend coaching cards, and architecture documentation.

### Added

- Added Milestone 4 Socket.IO infrastructure for connection lifecycle and room management.
- Added isolated `RoomManager` support for players, spectators, duplicate-join prevention, room capacity, and room cleanup.
- Added socket event constants and structured socket success/failure payload helpers.
- Added [SOCKET_ARCHITECTURE.md](./docs/SOCKET_ARCHITECTURE.md).
- Added Milestone 5 real-time multiplayer gameplay events backed by authoritative `ChessService` validation.
- Added move acceptance/rejection, board synchronization, draw offers, resignation, game-over broadcasts, and reconnect state restoration.
- Added [MULTIPLAYER.md](./docs/MULTIPLAYER.md).
- Added Milestone 6 Redis active-game storage architecture.
- Added [REDIS_ARCHITECTURE.md](./docs/REDIS_ARCHITECTURE.md).
- Added [FRONTEND_ARCHITECTURE.md](./docs/FRONTEND_ARCHITECTURE.md).
- Added [STOCKFISH_ARCHITECTURE.md](./docs/STOCKFISH_ARCHITECTURE.md).
- Added [GEMINI_ARCHITECTURE.md](./docs/GEMINI_ARCHITECTURE.md).
