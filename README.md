



  (`amount`, `type`, `balanceAfter`), written inside the same DB transaction as
  the balance update — this is what makes the balance auditable and race-safe.
- **Auth**: access tokens expire in 15 minutes. Refresh tokens are random,
  stored **hashed** in Postgres, single-use (rotated on every refresh), and
  individually revocable — a stolen access token is short-lived, and logout



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
