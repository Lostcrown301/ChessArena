# Game History & Review System (Milestone 10)

## Overview

The Game History & Review System allows players to browse past games and review them in a read-only environment. The backend exposes paginated HTTP endpoints, and the frontend provides a History list and a dedicated Review page.

This system leverages the existing persistence layer built in earlier milestones. Games, moves, and Stockfish/Gemini analysis are retrieved from PostgreSQL.

## Architecture

### Backend

- **`HistoryService`**: Orchestrates repository calls to fetch history data.
- **`history-repository.js`**: Provides paginated, filtered, and joined queries (joining the `games` table with the `players` table).
- **`history-controller.js` & `history.routes.js`**: Expose the HTTP endpoints.

#### Endpoints

1. `GET /api/history`
   - Query Params: `page`, `limit`, `result`, `search`, `sort`
   - Returns paginated game metadata and joined player display names.
2. `GET /api/history/:gameId`
   - Returns the full game record and all moves.
3. `GET /api/history/:gameId/pgn`
   - Returns raw PGN text.
4. `GET /api/history/:gameId/analysis`
   - Returns the game record, moves, and the persisted Stockfish/Gemini analysis record.
5. `GET /api/history/:gameId/review`
   - Returns an aggregated view containing the game, moves, and analysis in a single request.

### Frontend

- **History Page (`/history`)**: A searchable, filterable, and paginated list of past games.
- **Review Page (`/review/:gameId`)**: A read-only environment where users can step through the moves of a completed game.
  - Reuses the `react-chessboard` component in non-draggable mode.
  - Evaluates position using the FEN strings stored in each move record.
  - Reuses the `AnalysisPanel` and `AIAnalysisPanel` for engine and coaching insights.
- **Lobby Page**: Includes a `RecentGamesPanel` showing the 5 most recently completed games for quick access.

## Review Flow

The `ReviewPage` does **not** rely on `chess.js` or any client-side chess validation. 

When stepping through moves:
1. The frontend maintains a `currentIndex` into the `moves` array.
2. The board position is updated using the `fen` field of the current move.
3. The PGN and move list are derived from the backend data.
4. If an analysis record exists for the game, the Stockfish analysis panel is displayed (read-only).
5. The Gemini coaching panel allows users to request or view cached AI explanations.

## Pagination and Filtering

The `/api/history` endpoint supports standard offset-based pagination.
- **Filters**: `result` (e.g., `white_win`, `black_win`, `draw`)
- **Search**: Partial match on `gameId`.
- **Sort**: `desc` (newest first) or `asc` (oldest first) based on `startedAt`.
