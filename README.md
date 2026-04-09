# Currency Decision Assistant

Read-only CRC/USD decision support app powered by official BCCR data.

## Structure

- `apps/web`: React + Vite frontend
- `apps/api`: FastAPI API

## Data Sources

- `SDDE API`: official historical buy/sell exchange-rate series
- `Ventanilla BCCR`: authorized entities, buy price, sell price, differential, last update

## Run

### API

```bash
cd apps/api
cp .env.example .env
# paste your BCCR token into BCCR_SDDE_TOKEN
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --port 8000
```

### Web

```bash
cd apps/web
npm install
npm run dev
```

The frontend expects the API at `http://localhost:8000` by default.

## Current Scope

- `buy` and `sell` modes
- simple amount bands
- explainable heuristic
- no persistence layer
- live error states instead of mock fallback when BCCR data is unavailable
