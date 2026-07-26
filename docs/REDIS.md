# Redis Architecture

Redis is utilized in Chess Arena for two critical, interrelated purposes:
1. **Active Game State:** High-speed storage for ongoing games.
2. **Socket.IO Pub/Sub:** Enabling broadcast events across multiple Node.js instances.

---

## 1. Active Game Lifecycle

1. **Creation:** A player creates a game via REST API. The initial game object (with a starting FEN and empty players) is stored in Redis.
2. **Joining:** Players connect via WebSockets. The backend atomically retrieves the game, assigns a color, and writes the updated game back to Redis.
3. **Playing:** Every move reads the state from Redis, validates it in-memory via `chess.js`, and writes the new state back to Redis.
4. **Completion:** When a game reaches a terminal state (checkmate, draw, resignation), the final state is written to PostgreSQL for permanent archival, and the key is immediately deleted from Redis.

---

## 2. Key Structure

The application uses a prefixed key structure to prevent collisions.

```text
chess-arena:game:{uuid}
```
*Example:* `chess-arena:game:550e8400-e29b-41d4-a716-446655440000`

---

## 3. Serialization

Game state is serialized using standard JSON when storing strings in Redis.

```json
{
  "id": "550e8400-e29b...",
  "status": "active",
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "turn": "w",
  "players": {
    "w": { "id": "...", "name": "Alice" },
    "b": { "id": "...", "name": "Bob" }
  },
  "moves": [
    { "from": "e2", "to": "e4", "san": "e4" }
  ]
}
```
*Note: Because Redis only stores strings, the `moves` array and `players` object are serialized and deserialized heavily. However, since active game objects rarely exceed a few kilobytes, the JSON parse/stringify overhead is negligible.*

---

## 4. TTL Strategy

To prevent orphaned games from consuming memory indefinitely (e.g., if both players close their browsers and never return), every game key is assigned a Time-To-Live (TTL).

- **Configuration:** `ACTIVE_GAME_TTL_SECONDS` (Default: 3600 seconds / 1 hour).
- **Refresh:** Every time a player makes a move, the TTL on the Redis key is reset.
- **Eviction:** If an hour passes with no moves, Redis automatically deletes the key. The game is considered abandoned and will not be archived to PostgreSQL.

---

## 5. Recovery & Reconnection

- **`ioredis` Reconnection:** The backend utilizes `ioredis`, which implements exponential backoff reconnection by default. If the Render Redis instance briefly restarts or drops the connection, the Node service will pause requests and automatically reconnect without crashing.
- **Ephemeral Nature:** If the Redis server completely crashes and loses data (as is common on free-tier ephemeral instances without disk persistence), all active games are lost. In a production environment, configuring Redis with RDB/AOF persistence is recommended to allow active games to survive infrastructure restarts.
