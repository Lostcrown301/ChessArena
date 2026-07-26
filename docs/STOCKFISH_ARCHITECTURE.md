# Stockfish Architecture

Stockfish analysis is isolated from gameplay. The frontend asks the backend to
analyze a FEN, the backend queues the request, Stockfish evaluates the position,
and the API returns a structured result. ChessService remains the authority for
gameplay and never waits for engine analysis.

## Architecture

```text
Frontend AnalysisPanel
  -> POST /api/analysis
  -> analysis-controller
  -> AnalysisQueue
  -> StockfishService
  -> Stockfish 18 Lite WASM
  -> EvaluationMapper
  -> API response
```

Completed games are archived first. After archival, a background analysis job
evaluates the final FEN and updates the existing one-to-one `analysis` row.

## Engine Lifecycle

`StockfishService` lazily initializes the `stockfish` npm package using the
lite single-threaded WASM build. Lazy startup keeps regular API boot fast and
avoids loading the engine until analysis is requested.

The service exposes:

- `initialize`
- `shutdown`
- `evaluatePosition`

Server shutdown calls `stockfishService.shutdown()` so the engine receives
`quit` and releases runtime resources.

## Analysis Flow

1. Validate FEN with `chess.js`.
2. Clamp accepted search settings.
3. Queue the request through `AnalysisQueue`.
4. Send UCI commands:
   - `ucinewgame`
   - `setoption name MultiPV value 3`
   - `position fen ...`
   - `go depth ... movetime ...`
5. Parse `info` lines for score, depth, nodes, MultiPV, and PV.
6. Resolve on `bestmove`.

Already checkmated FENs return a mate result without waiting for a best move,
because there is no legal move for Stockfish to report.

## API

`POST /api/analysis`

Request:

```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "depth": 15,
  "timeLimit": 5000
}
```

Response:

```json
{
  "success": true,
  "data": {
    "evaluation": 0.31,
    "centipawns": 31,
    "mate": null,
    "bestMove": "e2e4",
    "depth": 15,
    "nodes": 123456,
    "pv": ["e2e4", "e7e5", "g1f3"],
    "topVariations": [],
    "analyzedAt": "2026-07-26T00:00:00.000Z",
    "durationMs": 1200
  }
}
```

Errors use the shared API envelope:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FEN",
    "message": "FEN is invalid."
  }
}
```

## Database

The `analysis` table keeps its existing game link and now stores final Stockfish
metadata:

- `final_evaluation`
- `centipawn_score`
- `mate_score`
- `best_move`
- `depth`
- `analyzed_at`

This keeps final evaluation linked to the existing analysis record without
changing gameplay persistence.

## Performance Strategy

Analysis runs through `AnalysisQueue`, which accepts multiple requests and
serializes access to the single Stockfish engine. This avoids overlapping UCI
searches while still allowing many callers to submit work.

Gameplay is independent:

- move validation never calls Stockfish
- Socket.IO gameplay handlers never wait for Stockfish
- final-game analysis is queued after PostgreSQL archival and runs in the
  background

## Limitations

- The current engine uses the lite single-threaded build for predictable server
  deployment.
- API requests wait for their queued analysis result.
- Completed-game final analysis requires PostgreSQL archival to succeed first.
- Gemini AI commentary consumes Stockfish output through a separate coaching API.
