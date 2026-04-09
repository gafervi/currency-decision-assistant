# Agent Notes

## Repo Shape
- This repo is two apps only: `apps/web` (Vite + React) and `apps/api` (FastAPI). The product is intentionally read-only; do not add persistence unless the user asks.
- Frontend entrypoints: `apps/web/src/main.tsx` -> `apps/web/src/app/App.tsx`.
- API entrypoint: `apps/api/app/main.py`; routes live in `apps/api/app/api/routes.py`.

## Commands
- Root shortcuts: `npm run dev:web`, `npm run build:web`, `npm run dev:api`.
- Frontend local commands: `npm install --prefix apps/web`, `npm run typecheck --prefix apps/web`, `npm run build --prefix apps/web`, `npm run dev --prefix apps/web`.
- Backend setup/run: from `apps/api`, create `.venv`, install with `pip install -e .`, then run `uvicorn app.main:app --reload --port 8000`.

## Verified Checks
- Frontend: `npm run typecheck --prefix apps/web` and `npm run build --prefix apps/web`.
- Backend: `python3 -m compileall app` in `apps/api`.
- There is no verified CI, lint, or test suite in the repo today.

## Runtime Gotchas
- `apps/api/app/core/config.py` loads `env_file=".env"` relative to the current working directory. Start the API from `apps/api` or use the root `npm run dev:api` script; otherwise `BCCR_SDDE_TOKEN` may not load.
- `README.md` still mentions `apps/api/.env.example`, but that file is not present; use `apps/api/.env`.
- Frontend API base URL is `VITE_API_BASE_URL` with fallback `http://localhost:8000`.
- The frontend polls `/dashboard` every 60 seconds. Backend caches are in-process: SDDE market context for 300s in `app/services/market_data.py`, ventanilla entities for 60s in `app/services/ventanilla.py`.

## Product Invariants
- Keep live-failure behavior: if BCCR data fails or the token is missing, surface an error state instead of mock data.
- `buy` mode means the user is buying USD with CRC; `sell` mode means the user is selling USD for CRC. Amount bands are asymmetric on purpose in `app/services/bands.py`.
- Recommendation logic uses official BCCR sell series (`318`) for `buy` mode and official buy series (`317`) for `sell` mode.
- SDDE rows can arrive future-dated; preserve them in raw history but exclude them from current snapshot and recommendation inputs.

## Frontend Wiring
- `App.tsx` owns `mode`, `amount`, `locale`, and dark mode, then loads all dashboard data through `useDashboardData`.
- Dark mode is implemented by toggling the `dark` class on `document.documentElement`; Tailwind 4 is wired through CSS imports in `src/styles/index.css` and `src/styles/tailwind.css`, not a Tailwind config file.
- The main UI path is the aggregated `GET /dashboard` endpoint; the older granular endpoints still exist for summary/history/entities/recommendation.
