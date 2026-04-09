from dataclasses import dataclass
from datetime import date, timedelta

from app.core.config import get_settings
from app.schemas import HistoryPoint, RateSnapshot
from app.services.bccr_sdde import BccrSddeClient
from app.services.cache import TimedCache


@dataclass
class MarketContext:
    snapshot: RateSnapshot
    buy_history: list[HistoryPoint]
    sell_history: list[HistoryPoint]
    source: str = "live"


market_cache = TimedCache[MarketContext](ttl_seconds=300)


def _latest_valid_point(points: list[HistoryPoint]) -> HistoryPoint:
    valid_points = [point for point in points if not point.future_dated]
    if not valid_points:
        raise ValueError("No non-future-dated points available")
    return valid_points[-1]


def get_market_context() -> MarketContext:
    return market_cache.get_or_set(_load_market_context)


def _load_market_context() -> MarketContext:
    settings = get_settings()
    client = BccrSddeClient()

    if not client.is_configured:
        raise RuntimeError("BCCR_SDDE_TOKEN is required to start the API")

    start_date = (date.today() - timedelta(days=120)).strftime("%Y/%m/%d")
    end_date = (date.today() + timedelta(days=1)).strftime("%Y/%m/%d")

    buy_history = client.get_indicator_series(
        settings.bccr_indicator_buy,
        start_date=start_date,
        end_date=end_date,
    )
    sell_history = client.get_indicator_series(
        settings.bccr_indicator_sell,
        start_date=start_date,
        end_date=end_date,
    )
    latest_buy = _latest_valid_point(buy_history)
    latest_sell = _latest_valid_point(sell_history)
    current = round((latest_buy.value + latest_sell.value) / 2, 2)
    snapshot = RateSnapshot(
        current_rate=current,
        official_buy_rate=latest_buy.value,
        official_sell_rate=latest_sell.value,
        spread=round(latest_sell.value - latest_buy.value, 4),
        observed_at=max(
            client.last_observed_at(settings.bccr_indicator_buy, buy_history),
            client.last_observed_at(settings.bccr_indicator_sell, sell_history),
        ),
    )
    return MarketContext(
        snapshot=snapshot,
        buy_history=buy_history,
        sell_history=sell_history,
        source="live",
    )
