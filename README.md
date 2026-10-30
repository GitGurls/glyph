


### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev          # http://localhost:5173
```

### 4. Tests

```bash
cd backend
npm test
```

Register a new account (50 free credits) or log in as the seeded admin to see
the Admin dashboard.

## Architecture notes worth knowing for an interview

- **Job queue**: generation requests return `202 Accepted` immediately. The API
  server only enqueues; a separate **worker process** (`npm run worker`) picks
  jobs off Redis, does the (mocked) generation work, and publishes status back
  over Redis pub/sub. The API server subscribes and re-broadcasts to the right
  browser over Socket.IO. Failed jobs retry 3x with exponential backoff, and
  exhausted jobs stay in Redis as a dead-letter queue instead of vanishing.
- **Credits ledger**: every balance change is a row in `CreditTransaction`
  (`amount`, `type`, `balanceAfter`), written inside the same DB transaction as
  the balance update — this is what makes the balance auditable and race-safe.
- **Auth**: access tokens expire in 15 minutes. Refresh tokens are random,
  stored **hashed** in Postgres, single-use (rotated on every refresh), and
  individually revocable — a stolen access token is short-lived, and logout
  actually invalidates the session server-side instead of just clearing local storage.
- **Validation**: every route's request body goes through a Zod schema before
  any handler logic runs — malformed input never reaches business logic.
- **Rate limiting**: Redis `INCR` + `EXPIRE`, keyed per user/route, so it holds
  up correctly if you ever run more than one API server instance.
- **Developer API**: `x-api-key` auth hits the exact same `createGenerationJob`
  function the browser's JWT-authenticated route uses — one pipeline, two doors in.
- **Moderation**: every prompt is checked before it's queued, and flagged jobs
  land in an admin review queue rather than being generated silently.

## Deployment

- `docker compose up -d --build` runs the **entire stack** containerized —
  Postgres, Redis, the API server, the worker, and the frontend (served by nginx).
- `.github/workflows/ci.yml` runs typecheck + tests + build on every push — wire
  it to a free Render/Fly.io/Railway deploy step once you're ready to host it live.

## Remaining gap to real production

The one thing that genuinely can't be made free: **real AI inference**. Swapping
the mock in `backend/src/worker.ts` for a real image/face-swap/video model
means either renting GPU compute or calling a paid inference API — there's no
way around that cost. Everything else in this repo — queueing, auth, payments
plumbing, validation, rate limiting, tests, CI, Docker — is genuinely production-shaped.
