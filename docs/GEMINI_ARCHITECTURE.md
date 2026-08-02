# Gemini Architecture

Gemini AI coaching turns trusted Stockfish analysis into human-friendly chess
explanations. Gemini is never used to validate moves, score positions, or alter
gameplay. Stockfish remains the source of truth for chess evaluation.

## Architecture

```text
Frontend AIAnalysisPanel
  -> POST /api/ai/explain
  -> ai-controller
  -> PromptBuilder
  -> GeminiService
  -> Gemini generateContent API
  -> ExplanationMapper
  -> API response
```

Persisted completed-game explanations are cached on the one-to-one `analysis`
record. Manual position explanations can be generated from frontend-provided
Stockfish context without changing gameplay state.

## Prompt Strategy

`PromptBuilder` gives Gemini only the chess facts it may explain:

- current FEN
- PGN
- Stockfish evaluation
- centipawn score
- mate score
- best move
- principal variation
- game result
- player color

The prompt instructs Gemini to treat Stockfish as authoritative, avoid inventing
moves, state uncertainty when data is missing, and return only a strict JSON
object. This keeps the coaching layer educational without letting it become a
second chess engine.

Supported styles:

- `beginner`
- `intermediate`
- `advanced`

## AI Flow

1. The user requests an explanation manually.
2. The backend validates the requested style.
3. If `analysisId` is provided, the backend checks for a cached explanation with
   the same style.
4. If no cache is available, the backend builds a prompt from persisted
   Stockfish/game data or the submitted analysis context.
5. `GeminiService` calls the Gemini `generateContent` endpoint.
6. `ExplanationMapper` normalizes the JSON response.
7. Persisted analysis requests update the existing `analysis` row.
8. The frontend renders the summary, mistakes, tips, best-move explanation, and
   difficulty badge.

## API

`POST /api/ai/explain`

Persisted analysis request:

```json
{
  "analysisId": "1",
  "style": "beginner"
}
```

Manual position request:

```json
{
  "style": "intermediate",
  "context": {
    "currentFen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    "pgn": "",
    "stockfish": {
      "evaluation": 0.31,
      "centipawns": 31,
      "mate": null,
      "bestMove": "e2e4",
      "depth": 12,
      "pv": ["e2e4", "e7e5", "g1f3"]
    },
    "gameResult": "ACTIVE",
    "playerColor": "white"
  }
}
```

Response:

```json
{
  "success": true,
  "data": {
    "summary": "White has a small opening edge...",
    "mistakes": [],
    "tips": ["Develop pieces before launching attacks."],
    "bestMoveExplanation": "Stockfish prefers e2e4 because...",
    "turningPoints": [],
    "openingObservations": [],
    "endgameObservations": [],
    "difficulty": "Beginner",
    "style": "beginner",
    "generatedAt": "2026-07-26T00:00:00.000Z",
    "cached": false
  }
}
```

## Caching

Completed-game explanations are cached on the `analysis` row using:

- `ai_summary`
- `ai_tips`
- `ai_explanation`
- `ai_difficulty`
- `ai_style`
- `ai_generated_at`

The cache is style-aware. A beginner explanation is reused only for beginner
requests; requesting an advanced explanation regenerates and replaces the cached
AI fields for that analysis record.

## Error Handling

The API returns the shared response envelope for failures:

```json
{
  "success": false,
  "error": {
    "code": "GEMINI_TIMEOUT",
    "message": "Gemini explanation timed out."
  }
}
```

### Resilience & Retry Logic

The Gemini service implements an **exponential backoff retry loop** to handle transient network issues or rate limits gracefully.

- If the API returns a `429 Too Many Requests` or any `5xx Server Error`, the service automatically retries the request up to 3 times.
- The delay doubles on each attempt (e.g., 500ms, 1000ms, 2000ms).
- If the request still fails after the maximum attempts, the final error is thrown.

Handled conditions include:

- missing or invalid analysis IDs
- Gemini timeout
- Gemini rate limit
- invalid Gemini response JSON
- unavailable Gemini service
- missing production API key

Local development can run without `GEMINI_API_KEY`; the service returns a
deterministic fallback explanation so the API and UI remain testable.

## Performance Strategy

Gemini requests are manual and independent from gameplay. Move validation,
Socket.IO synchronization, Stockfish analysis, and Redis state updates never wait
for Gemini. The frontend shows loading and retry states for long-running or
failed coaching requests.

## Limitations

- Gemini can explain only the Stockfish and PGN context it receives.
- Manual position explanations are not cached because they are not tied to a
  persisted analysis record.
- The current cache stores one style per persisted analysis record.
- The coach does not generate its own chess evaluation.
