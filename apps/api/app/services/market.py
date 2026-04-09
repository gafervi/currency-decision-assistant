from app.schemas import RateSnapshot
from app.services.market_data import get_market_context


def get_market_snapshot() -> RateSnapshot:
    return get_market_context().snapshot
