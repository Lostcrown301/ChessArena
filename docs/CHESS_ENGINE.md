# Chess Engine

The Chess Arena backend is the single source of truth for active games. Clients can request actions, but the backend owns validation, move application, board state, and game status.

## Architecture

- `backend/src/controllers/game-controller.js`: HTTP request validation, status codes, and consistent response envelopes.
- `backend/src/routes/game.routes.js`: REST routes for active games.
- `backend/src/services/chess/ChessService.js`: authoritative chess workflow and state mutation.
- `backend/src/services/chess/ChessValidator.js`: player, turn, and legal move validation.
- `backend/src/services/chess/ChessMapper.js`: stable API response shapes.
- `backend/src/services/chess/store/GameStore.js`: active-game storage contract.
- `backend/src/services/chess/store/InMemoryGameStore.js`: local/test active-game storage.
- `backend/src/services/chess/store/RedisGameStore.js`: production Redis active-game storage.

Completed games are archived to PostgreSQL after terminal game states. Active
games remain in the selected active-game store.

## Request Lifecycle

1. A client calls a `/api/games` endpoint.
2. The controller reads request data and delegates to `ChessService`.
3. `ChessService` loads the active game through the `GameStore` contract.
4. `ChessValidator` verifies game existence, player membership, turn ownership, and move legality.
5. `chess.js` applies legal moves to the authoritative `Chess` instance.
6. `ChessMapper` returns board, FEN, PGN, turn, status, players, and rule flags.
7. The controller sends `{ "success": true, "data": ... }` or `{ "success": false, "error": ... }`.

## chess.js Integration

`chess.js` is used for legal move validation and game-state detection:

- illegal move rejection
- wrong-turn protection through `turn()`
- check through `isCheck()`
- checkmate through `isCheckmate()`
- draw through `isDraw()`
- stalemate through `isStalemate()`
- threefold repetition through `isThreefoldRepetition()`
- fifty-move rule through `isDrawByFiftyMoves()`
- insufficient material through `isInsufficientMaterial()`

The live `Chess` instance is mutated only after validation passes.

## GameStore Design

`GameStore` hides whether active games are stored in memory or Redis.

Each active game contains:

- `gameId`
- `whitePlayer`
- `blackPlayer`
- `Chess` instance
- current FEN
- current PGN
- move history
- current turn
- game status
- `createdAt`
- `updatedAt`

The store exposes `createGame`, `getGame`, `updateGame`, `deleteGame`,
`hasGame`, `listGames`, `save`, and `clear` methods so `ChessService` does not
depend directly on Redis, `Map`, or the `ActiveGame` constructor.

## Why Active Games Use A Store Boundary

Active multiplayer games change frequently and need fast reconnect reads.
`ChessService` depends on the store contract instead of Redis directly so tests,
local development, and production can use different storage without changing
chess rules.

## Why The Backend Is Authoritative

Clients cannot submit trusted board state. They send requested moves only. The backend validates every move against its own `Chess` instance before updating FEN, PGN, move history, and status.

## Redis Storage

Redis stores active games as JSON snapshots with a TTL that refreshes on every
successful state update. See [REDIS_ARCHITECTURE.md](./REDIS_ARCHITECTURE.md).
