# Security & Resilience

Chess Arena is built with production security and application resilience in mind. This document outlines the security measures implemented in the platform.

---

## 1. Request Security (Helmet)

The backend utilizes `helmet()` to set secure HTTP headers on every incoming request. This mitigates common web vulnerabilities:
- **XSS Protection:** Sets the `X-XSS-Protection` header.
- **Clickjacking:** Sets the `X-Frame-Options` header to `DENY` or `SAMEORIGIN`.
- **MIME Sniffing:** Prevents browsers from guessing the MIME type via `X-Content-Type-Options: nosniff`.
- **Powered-By Hiding:** Removes the `X-Powered-By: Express` header to obscure the backend stack.

---

## 2. Cross-Origin Resource Sharing (CORS)

Chess Arena enforces strict CORS policies.
- In `production`, the backend strictly validates the `Origin` header against the `CORS_ORIGIN` environment variable.
- Wildcards (`*`) are explicitly forbidden in production to prevent Cross-Site Request Forgery (CSRF) and unauthorized API consumption.
- Socket.IO connections enforce the exact same CORS policy as the REST API.

---

## 3. Rate Limiting

Granular rate limiting is implemented across the API to prevent brute-force attacks and CPU exhaustion.

| Route | Window | Max Requests | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/health` | 1 minute | 1000 | Very generous, allows frequent load-balancer pings. |
| `/api/games` | 1 minute | 100 | Generous, allows normal matchmaking and creation. |
| `/api/history` | 1 minute | 60 | Moderate, prevents scraping of the game database. |
| `/api/analysis` | 1 minute | 20 | Restrictive, Stockfish is CPU-intensive and queue-bound. |
| `/api/ai` | 1 minute | 10 | Highly restrictive, Gemini API calls cost money and have external quotas. |

If limits are exceeded, a `429 Too Many Requests` is returned with a standardized JSON error envelope.

---

## 4. Input Validation & Error Sanitization

- **Payload Limits:** `express.json({ limit: '1mb' })` is strictly enforced to prevent large payload Denial of Service (DoS) attacks.
- **Structured Errors:** The global error handler intercepts all exceptions. In `production`, raw stack traces are stripped, and generic `500 Internal Server Error` messages are safely returned to prevent information leakage.
- **Chess Engine Sandbox:** Stockfish input (FEN strings) are strictly validated and parsed using `chess.js` before ever touching the engine via UCI commands. Malformed FENs are rejected immediately.

---

## 5. Environment Secrets

- Ensure `NODE_ENV=production` is always set in your production environment.
- `GEMINI_API_KEY` and `DATABASE_URL` must be injected securely via your hosting provider (e.g., Render Environment Variables, AWS Secrets Manager). They must never be hardcoded or checked into Git.
- Ensure the `frontend` does NOT contain any backend secrets. Only variables prefixed with `VITE_` are exposed to the browser.

---

## 6. Responsible Disclosure

If you discover a security vulnerability within Chess Arena, please do not disclose it publicly. Instead, open a private security advisory on the GitHub repository or contact the maintainers directly.
