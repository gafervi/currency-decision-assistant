# API

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --port 8000
```

Create `apps/api/.env` from `.env.example` before enabling real BCCR requests.

## Token Location

Paste the BCCR token in:

- `apps/api/.env`
- variable: `BCCR_SDDE_TOKEN=...`

## Architecture

This backend is read-only.

- Official rates and history come from the BCCR `SDDE` API.
- Entity quotes come from the BCCR `ventanilla` page.
- No database is required for the current app flow.
