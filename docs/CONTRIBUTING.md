# Contributing to Chess Arena

Welcome! We are excited to have you contribute to Chess Arena. This document outlines our development workflows, architectural conventions, and code standards.

---

## 1. Project Setup

Chess Arena contains two independent applications: a React `frontend` and an Express `backend`. Both rely heavily on modern ES Modules and Node.js v20+.

1. Fork and clone the repository.
2. Install dependencies and configure environment variables in each project directory:
   ```bash
   # Backend setup
   cd backend
   npm install
   cp .env.example .env

   # Frontend setup (in a separate terminal or after backend setup)
   cd ../frontend
   npm install
   cp .env.example .env
   ```
3. Start the dev servers in their respective project directories (`cd backend && npm run dev` and `cd frontend && npm run dev`).

---

## 2. Coding Standards

- **ES Modules:** We strictly use ESM (`import`/`export`). Do not use `require`.
- **Formatting:** Prettier is configured per project. Run `npm run format` inside `backend/` or `frontend/` before committing.
- **Linting:** ESLint runs in strict mode per project. Run `npm run lint` inside `backend/` or `frontend/`. Warning-level lints should be treated as errors in PRs.
- **State Mutation:** Never mutate state directly in React or in the backend stores. Always return cloned/updated objects.
- **JSDoc:** Add concise JSDoc comments to public classes, complex algorithms (like Stockfish parsers), and exported service methods. Do not write redundant comments for self-explanatory code (e.g., `// gets the user`).

---

## 3. Folder & Naming Conventions

### General

- Directories and files should be `kebab-case` (e.g., `game-repository.js`), EXCEPT for React Components and ES6 Classes, which must be `PascalCase` (e.g., `ChessBoard.jsx`, `StockfishService.js`).
- Unit tests (when added) should live adjacent to the file they test (`game-repository.test.js`).

### Frontend (`frontend/src/`)

- `components/`: Pure, reusable UI primitives (Buttons, Modals) and complex isolated widgets.
- `pages/`: Routable, full-screen views. Usually constructed by composing components.
- `context/`: React Context providers for global state (Theme, Auth, Socket).
- `services/`: API and Socket.IO interaction layers.

### Backend (`backend/src/`)

- `controllers/`: Handles HTTP request/response formatting only. No business logic.
- `services/`: The core business logic (AI, Engine, Chess rules).
- `routes/`: Express route definitions connecting paths to controllers.
- `socket/`: Socket.IO event handlers.
- `db/`: Drizzle ORM schemas and connection logic.

---

## 4. Git Workflow & PR Guidelines

1. **Branching:** Create a branch from `main` using the format `feature/your-feature-name` or `bugfix/issue-description`.
2. **Commits:** Write clear, imperative commit messages:
   - `feat: add spectator mode`
   - `fix: resolve race condition in Redis reconnect`
   - `docs: update API reference for AI coaching`
3. **Pull Requests:**
   - Ensure `npm run lint` and `npm run build` pass successfully.
   - Describe the "Why" in your PR description.
   - If adding a feature, provide a screenshot or GIF in the description.

---

## 5. Development Guides

### How to add a new REST endpoint

1. Identify the domain (e.g., `users`).
2. Add a new route file in `backend/src/routes/users.routes.js`.
3. Create the corresponding controller in `backend/src/controllers/users-controller.js`.
4. Delegate complex logic to a service (e.g., `backend/src/services/UserService.js`).
5. Register the router in `backend/src/routes/index.js`.
6. Update `docs/API_REFERENCE.md`.

### How to add a new Socket.IO event

1. Define the event handler in `backend/src/socket/game-handlers.js` or a new domain handler.
2. Bind the event in `backend/src/socket/socket-server.js` within the `registerConnectionHandler` lifecycle.
3. If it requires frontend interaction, update `frontend/src/services/gameSocketService.js`.
4. Document the new payload in `docs/SOCKET_EVENTS.md`.

### How to add a new Frontend Page

1. Create the component in `frontend/src/pages/MyNewPage.jsx`.
2. Add the route in `frontend/src/routes/index.jsx` using `React.lazy()` for code splitting.
3. Ensure the page layout is wrapped appropriately (e.g., using `MainLayout`).
