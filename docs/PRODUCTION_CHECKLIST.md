# Production Checklist

Before launching Chess Arena to a public audience, verify the following configuration and operational checks.

## Infrastructure & Configuration

- [ ] **Environment Variables Validated**: Ensure `NODE_ENV=production` is set so Express disables stack traces and optimizes caching.
- [ ] **Strict CORS Enforcement**: `CORS_ORIGIN` is explicitly set to the production frontend domain (no wildcards).
- [ ] **Trust Proxy**: Render load balancer is trusted (`app.set('trust proxy', 1)`). Rate limiters will accurately read client IPs.
- [ ] **Connection Pooling Limitations**: Neon serverless Postgres limits connections based on tier. Ensure backend instances don't exceed Neon connection limits during auto-scaling.
- [ ] **Redis Persistence**: Render Redis is ephemeral on the free tier. For production, ensure persistence is enabled if preserving active games across complete infrastructure reboots is critical.

## Security & Reliability

- [ ] **Rate Limiting Active**:
  - `/api/health` is generous.
  - `/api/analysis` (Stockfish) and `/api/ai` (Gemini) are strictly limited to prevent abuse and CPU exhaustion.
- [ ] **Helmet Headers**: `helmet()` middleware is active, preventing basic XSS and injection vectors.
- [ ] **Payload Limits**: `express.json` is restricted to `1mb` to prevent large payload attacks.
- [ ] **Stockfish Crash Recovery**: Ensure Stockfish spawns successfully and correctly rejects hanging promises if the process crashes.

## Observability

- [ ] **Structured Logging**: `pino-http` is active and generating JSON logs. Ensure `pino-pretty` is completely disabled via `NODE_ENV=production`.
- [ ] **Request IDs**: All incoming HTTP requests generate or inherit an `x-request-id`, enabling end-to-end tracing in logs.
- [ ] **Readiness Probe**: `/api/health/ready` accurately reports the state of PostgreSQL and Redis.
- [ ] **Log Retention**: Render retains logs for a limited time. Consider attaching a log drain (e.g., Datadog, Papertrail) for long-term retention.

## Frontend

- [ ] **Code Splitting**: Routes are chunked using `React.lazy()` and Suspense.
- [ ] **Error Boundaries**: A root `ErrorBoundary` wraps the entire application provider tree to prevent blank screens during uncaught rendering errors.
- [ ] **Asset Optimization**: Vite handles minification and source maps. Source maps should not be published if code secrecy is desired (though it's open-source, so they are fine).
