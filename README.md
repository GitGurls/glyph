







## Remaining gap to real production

The one thing that genuinely can't be made free: **real AI inference**. Swapping
the mock in `backend/src/worker.ts` for a real image/face-swap/video model
means either renting GPU compute or calling a paid inference API — there's no
way around that cost. Everything else in this repo — queueing, auth, payments
plumbing, validation, rate limiting, tests, CI, Docker — is genuinely production-shaped.
