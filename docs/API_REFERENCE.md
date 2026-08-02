# API Reference

This document outlines the REST API exposed by the Chess Arena backend.

All endpoints are relative to the base URL, e.g., `http://localhost:4000/api`.

---

## API Versioning Policy

The current API is unversioned (v1 implicitly).

**Future Breaking Changes:**
To maintain backwards compatibility for existing clients, any breaking changes to requests, payloads, or URL structures MUST be introduced under a new version namespace (e.g., `/api/v2/...`). Existing endpoints should remain functional until they are formally deprecated and sunset.

---

## 1. Health

### 1.1 Liveness Probe

- **Method:** `GET`
- **URL:** `/health`
- **Purpose:** Verifies that the Express API process is running and accepting HTTP requests.
- **Request Body:** None
- **Query Parameters:** None
- **Success Response (200 OK):**
  ```json
  {
    "status": "ok",
    "service": "chess-arena-api",
    "timestamp": "2026-07-26T12:00:00.000Z"
  }
  ```

### 1.2 Readiness Probe

- **Method:** `GET`
- **URL:** `/health/ready`
- **Purpose:** Deep health check verifying connectivity to PostgreSQL, Redis, Stockfish, and Gemini. Gemini is considered a soft dependency (degraded).
- **Request Body:** None
- **Query Parameters:** None
- **Success Response (200 OK):**
  ```json
  {
    "service": "chess-arena-api",
    "ready": true,
    "timestamp": "2026-07-26T12:00:00.000Z",
    "dependencies": {
      "database": "ok",
      "redis": "ok",
      "stockfish": "ok",
      "gemini": "configured"
    }
  }
  ```
- **Error Response (503 Service Unavailable):** Returned if a critical dependency (Redis, PostgreSQL, Stockfish) is unreachable.

---

## 2. Games (Active)

### 2.1 Create Game

- **Method:** `POST`
- **URL:** `/games`
- **Purpose:** Initializes a new active game in the memory/Redis store.
- **Request Body:** None
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid-v4",
      "status": "waiting",
      "players": { "w": null, "b": null },
      "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    }
  }
  ```

### 2.2 Join Game

- **Method:** `POST`
- **URL:** `/games/:gameId/join`
- **Purpose:** Assigns a player to an open color slot (white or black).
- **Request Body:**
  ```json
  {
    "playerId": "uuid-v4",
    "playerName": "Player 1"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "color": "w"
    }
  }
  ```
- **Error Responses:**
  - `404 Not Found`: Game does not exist.
  - `400 Bad Request`: Game is full, or player is already in the game.

### 2.3 Get Active Game State

- **Method:** `GET`
- **URL:** `/games/:gameId`
- **Purpose:** Fetches the full current state of an active game.
- **Success Response (200 OK):** Returns the full active game object.

### 2.4 Request Move (HTTP fallback)

- **Method:** `POST`
- **URL:** `/games/:gameId/move`
- **Purpose:** HTTP alternative to Socket.IO for submitting a chess move.
- **Request Body:**
  ```json
  {
    "playerId": "uuid-v4",
    "move": { "from": "e2", "to": "e4" }
  }
  ```

---

## 3. History (Completed Games)

### 3.1 List Completed Games

- **Method:** `GET`
- **URL:** `/history`
- **Purpose:** Retrieves a paginated list of archived games.
- **Query Parameters:**
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `playerId` (optional): Filter by player UUID.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [ ... ],
    "meta": { "total": 100, "page": 1, "totalPages": 10 }
  }
  ```

### 3.2 Get Completed Game Details

- **Method:** `GET`
- **URL:** `/history/:gameId`
- **Purpose:** Retrieves metadata and the move list for a specific completed game.

### 3.3 Get Game PGN

- **Method:** `GET`
- **URL:** `/history/:gameId/pgn`
- **Purpose:** Retrieves the raw PGN string of a completed game.

### 3.4 Get Game Review Data

- **Method:** `GET`
- **URL:** `/history/:gameId/review`
- **Purpose:** Combines the historical game data with saved Stockfish analysis and Gemini coaching feedback.

---

## 4. Analysis (Stockfish)

### 4.1 Analyze Position

- **Method:** `POST`
- **URL:** `/analysis`
- **Purpose:** Submits a FEN to the Stockfish engine for evaluation.
- **Request Body:**
  ```json
  {
    "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    "depth": 15,
    "timeLimit": 3000
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "fen": "...",
      "evaluation": { "type": "cp", "value": 35 },
      "bestMove": "e2e4",
      "depth": 15
    }
  }
  ```

---

## 5. AI (Gemini)

### 5.1 Request Coaching Explanation

- **Method:** `POST`
- **URL:** `/ai/explain`
- **Purpose:** Uses Google Gemini to translate a Stockfish evaluation into human-readable advice.
- **Request Body:**
  ```json
  {
    "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    "stockfish": {
      "evaluation": { "type": "cp", "value": 35 },
      "bestMove": "e2e4"
    },
    "pgn": "...",
    "style": "beginner"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "summary": "White has a slight opening advantage.",
      "tips": ["Control the center.", "Develop minor pieces."],
      "bestMoveExplanation": "Moving the pawn to e4 controls d5 and frees the bishop."
    }
  }
  ```
- **Error Responses:**
  - `503 Service Unavailable`: Gemini API is down or unconfigured.
  - `429 Too Many Requests`: Rate limit exceeded.
