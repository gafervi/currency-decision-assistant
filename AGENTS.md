# Agent Notes

## Current Reality
- The repo is now split into two real apps:
  - `apps/web`: Vite/React frontend
  - `apps/api`: FastAPI read-only API
- The product is intentionally read-only. Do not add database or persistence layers unless the user explicitly asks for them.

## App Root And Entry Points
- Frontend app root: `apps/web`
- API app root: `apps/api`
- Frontend entrypoint: `apps/web/src/main.tsx`
- Frontend composition starts at `apps/web/src/app/App.tsx`
- API entrypoint: `apps/api/app/main.py`

## Frontend Tooling
- The frontend uses `vite` with `@vitejs/plugin-react` and `@tailwindcss/vite`.
- Keep both Vite plugins in `apps/web/vite.config.ts`.
- The `@` alias points to `./src`.
- Tailwind 4 is configured through CSS imports, not a separate JS config:
  - `src/styles/index.css`
  - `src/styles/tailwind.css`
  - `src/styles/theme.css`
- Dark mode is implemented by toggling the `dark` class on `document.documentElement` in `src/app/App.tsx`. Preserve that mechanism unless the user asks to replace it.

## Commands
- Frontend install: `npm install --prefix apps/web`
- Frontend dev: `npm run dev --prefix apps/web`
- Frontend build: `npm run build --prefix apps/web`
- API env and install:
  - `cd apps/api`
  - `python3 -m venv .venv`
  - `source .venv/bin/activate`
  - `pip install -e .`
- API dev: `uvicorn app.main:app --reload --port 8000`

## Runtime Rules
- `apps/api/.env` must contain a valid `BCCR_SDDE_TOKEN`; the API should fail loudly if live data is unavailable.
- Do not reintroduce mock fallbacks into the user-facing flow. If BCCR sources fail, show an error state instead of fabricated values.

## BCCR Data Plan
- Use the `SDDE API` as the source of truth for historical and official exchange-rate analysis.
- Use the BCCR `ventanilla` page as the source for entities, buy/sell prices, differential, and last update.
- The new SDDE API documented in `Estandar_API_SDDE.pdf` uses bearer-token auth against:
  - `https://apim.bccr.fi.cr/SDDE/api/Bccr.GE.SDDE.Publico.Indicadores.API`
- Relevant verified SDDE endpoint patterns are:
  - `/indicadoresEconomicos/{codigo}/metadata?idioma=es`
  - `/indicadoresEconomicos/{codigo}/series?fechaInicio=yyyy/mm/dd&fechaFin=yyyy/mm/dd&idioma=es`
  - `/indicadoresEconomicos/descargar?idioma=es`
  - `/cuadro/descargar?idioma=es`

## MVP Indicator Assumptions
- Start the MVP by validating only two core SDDE indicators:
  - `317` assumed to be official `compra`
  - `318` assumed to be official `venta`
- For UI and API behavior:
  - `buy` mode should use `318` as the primary official reference
  - `sell` mode should use `317` as the primary official reference

## Data Quality Rules
- The SDDE API may return rows dated one day after today.
- When ingesting SDDE series, preserve raw rows but mark rows with `fecha > hoy` as `future_dated`.
- Exclude `future_dated` rows from:
  - current summary
  - primary chart display
  - recommendation calculations

## Recommendation Rules
- The product must support both user modes:
  - `buy` for buying USD
  - `sell` for selling USD
- The UI should expose a central mode switch so the same data is interpreted differently for buying vs selling.
- Use a simple, explainable heuristic first. The planned inputs are:
  - moving averages `7/30/90`
  - deviation vs 30-day average
  - short-term volatility
  - short-vs-medium trend
- Planned outputs are:
  - `buy`
  - `sell`
  - `wait`
  - `partial`
- Explanations should stay short and human-readable.

## Amount Personalization
- Recommendation logic should be personalized, but only with simple amount bands.
- Use these base ranges for the MVP:
  - `small`: up to `CRC 250,000` or `USD 500`
  - `medium`: up to `CRC 1,000,000` or `USD 2,000`
  - `large`: above those ranges
- Higher amounts should require higher confidence before recommending a full action; medium amounts can more easily produce a partial recommendation.

## Backend Shape
- Current API surface:
  - `GET /health`
  - `GET /summary?mode=buy|sell&amount=...`
  - `GET /history?mode=buy|sell`
  - `GET /entities?mode=buy|sell`
  - `GET /recommendation?mode=buy|sell&amount=...`
  - `GET /catalog`

## Verification Limits
- There are still no verified tests, lint, or CI workflows.
- The main verification steps currently used are:
  - `python3 -m compileall app` in `apps/api`
  - `npm run build` in `apps/web`
- `apps/web/package-lock.json` is now the frontend lockfile; use `npm`, not `pnpm`.
