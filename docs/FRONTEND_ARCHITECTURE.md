# Frontend Architecture

This document describes the scalable React foundation for Chess Arena. The
frontend includes lobby communication and a real-time multiplayer game page
backed by the existing Socket.IO API. The frontend never validates chess rules;
the backend remains the single source of truth. Stockfish analysis is available
through a manual API request, and Gemini AI coaching explains those results only
after the user requests it.

## Folder Structure

```text
frontend/src/
|-- assets/
|-- components/
|   |-- common/
|   |-- game/
|   |-- layout/
|   `-- ui/
|-- config/
|-- constants/
|-- context/
|-- hooks/
|-- layouts/
|-- lib/
|-- pages/
|-- routes/
|-- services/
|   |-- api/
|   `-- socket/
|-- styles/
|-- utils/
|-- App.jsx
`-- main.jsx
```

## Routing

React Router owns the route table:

- `/` renders `HomePage`
- `/lobby` renders `LobbyPage`
- `/game/:gameId` renders `GamePage`
- `*` renders `NotFoundPage`

Routes are nested under `App` and `MainLayout` so providers, navigation, footer,
and content spacing are consistent across pages.

## Lobby Flow

The lobby is the first interactive frontend flow:

1. The user chooses a display name.
2. The name is trimmed, limited to 20 characters, and persisted in
   `localStorage`.
3. The user can create a new game or paste an existing game ID.
4. Successful create/join actions store the current game ID and backend-generated
   player identity in `GameContext`.
5. The app navigates to `/game/:gameId`.

Lobby create/join actions use Socket.IO so room membership and `game_started`
broadcasts happen in real time.

## Navigation Flow

The home page presents the product description and links users to the lobby for
create and join actions. The lobby owns backend communication. The game page
owns socket synchronization, move requests, draw/resign controls, refresh
recovery, and live rendering from backend state.

## Game Creation Flow

`CreateGameCard` calls the lobby page handler, which:

1. verifies a display name exists,
2. sets loading state in `GameContext`,
3. emits `create_game`,
4. stores the returned game ID and white player ID,
5. navigates to `/game/:gameId`.

Duplicate submissions are prevented by disabling actions while loading.

## Join Flow

`JoinGameCard` validates the entered game ID before emitting `join_game`.
Validation covers:

- empty values
- invalid UUID format
- server errors such as missing games or full games
- network failures

Errors are converted into friendly messages through the shared error mapper.

## Layouts

`MainLayout` provides:

- `Navbar`
- responsive content area
- `Footer`

The layout is semantic, keyboard-friendly, and responsive from mobile widths up
to desktop.

## Game Page Layout

`GamePage` composes the chess interface without owning chess rules:

- top lifecycle strip with Socket.IO connection status
- black player panel from backend player state
- responsive `react-chessboard` board from backend FEN
- white player panel from backend player state
- side stack for waiting state, game status, captured pieces, controls, manual
  Stockfish analysis, and AI coaching
- terminal result banner when the backend completes the game
- lower grid for backend move history, PGN, and game information

Desktop layouts place the board and information panels side by side. Tablet and
mobile layouts stack vertically, preserving readable spacing and keyboard focus
order.

## Component Hierarchy

Reusable components are grouped by responsibility:

- `components/ui`: low-level primitives such as `Button`, `Input`, `Card`,
  `Modal`, `LoadingSpinner`, `Toast`, `Badge`, and `Avatar`.
- `components/common`: route-level and state components such as
  `PageContainer`, `Section`, `EmptyState`, `ErrorState`, and
  `ConnectionStatus`.
- `components/game`: visual game-screen components such as `ChessBoardPanel`,
  `PlayerPanel`, `MoveHistoryPanel`, `CapturedPiecesPanel`,
  `GameStatusPanel`, `GameInfoPanel`, `GameControls`, `TimerDisplay`,
  `GameResultBanner`, and `WaitingForOpponent`.
- `components/layout`: navigation and footer components used by layouts.

Components are presentation-first and avoid business logic.

## Game Synchronization

`GamePage` synchronizes in this order:

1. Connect Socket.IO.
2. Request `game_state` with the persisted player ID when available.
3. Restore the Socket.IO room on the backend.
4. Render the returned backend snapshot.
5. Register server broadcasts such as `board_updated`, `move_accepted`,
   `move_rejected`, `draw_offer`, `player_resigned`, and `game_over`.

The chessboard uses backend FEN directly. Dragging is enabled only when the
socket is connected, the game is active, and the backend snapshot says it is the
current player's turn. Dropping a piece emits `make_move` and immediately returns
`false` to prevent local board mutation. The board updates only after a
server-accepted response or broadcast.

## Reconnect Flow

Player identity is stored per game in `localStorage` under a game-session map.
When the browser refreshes or reconnects, the page emits `request_game_state`
with that player ID. The backend restores room membership, marks the player
connected, and returns the latest FEN, PGN, move history, status, draw offer,
players, and result state.

If a visitor has no stored player identity, the page can render server state in
a locked mode. If the game is still waiting and a display name exists, it may
join as Black through `join_game`.

## Contexts

The app defines provider boundaries:

- `SocketContext`: socket connection lifecycle shape.
- `GameContext`: backend game snapshot, current game ID, persisted player
  sessions, loading state, and display name.
- `ThemeContext`: dark theme default.

`GameContext` mirrors backend snapshots and does not validate rules or derive a
separate board model.

## Analysis And Coaching Panels

`AnalysisPanel` requests Stockfish analysis through `POST /api/analysis`.
Analysis is manual only: the frontend does not analyze every move and does not
block gameplay while the engine is thinking. The panel displays the evaluation
bar, engine status, best move, search depth, mate result, and principal
variation from the backend response.

`AIAnalysisPanel` calls `POST /api/ai/explain` only after Stockfish data exists.
It sends the current backend FEN, PGN, player color, game result, and Stockfish
response as context. The panel supports beginner, intermediate, and advanced
styles, loading/error states, retry, cached responses from persisted analysis,
and a difficulty badge. It never emits gameplay socket events.

## Hooks

Hooks expose their matching contexts:

- `useSocket`
- `useGame`
- `useTheme`

They are intentionally small so future state can be added behind stable imports.

## API Layer

`services/api/apiClient.js` creates an Axios client with:

- base URL from Vite environment variables
- request timeout
- request interceptor
- response interceptor
- centralized `ApiClientError`

`services/api/GameService.js` remains available for HTTP game endpoints:

- `createGame`
- `joinGame`

`services/api/AnalysisService.js` and `services/api/AIService.js` isolate
Stockfish and Gemini HTTP calls. All requests still pass through `apiClient`.

## Socket Layer

`services/socket/socketClient.js` creates a Socket.IO client lazily and exports:

- `connect`
- `disconnect`
- `getSocket`

The socket does not auto-connect.

`services/socket/gameSocketService.js` wraps Socket.IO acknowledgements for
gameplay events. It exposes create, join, request state, make move, draw, resign,
and leave-room helpers while preserving the backend response envelope.

`GamePage` registers handlers for existing backend events and updates
`GameContext` only from server-confirmed payloads.

## Styling

Global styles define:

- dark theme variables
- modern typography
- consistent focus styles
- responsive container utility
- Tailwind theme tokens

## Future Expansion Strategy

Future milestones can add feature modules without changing the foundation:

- API methods can be added beside `apiClient`.
- Socket event adapters can be added beside `gameSocketService`.
- More server-confirmed gameplay state can be added inside `GameContext`.
- Connection state can be added inside `SocketContext`.
- Timers can replace the current static timer display once backend timer state
  exists.
- AI coaching can add richer explanation cards without changing the real-time
  board authority model.
