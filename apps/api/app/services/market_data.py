from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone

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


def _previous_valid_point(points: list[HistoryPoint]) -> HistoryPoint:
    valid_points = [point for point in points if not point.future_dated]
    if len(valid_points) < 2:
        raise ValueError("At least two non-future-dated points are required")
    return valid_points[-2]


def _next_future_point(points: list[HistoryPoint]) -> HistoryPoint | None:
    return next((point for point in points if point.future_dated), None)


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
    previous_buy = _previous_valid_point(buy_history)
    previous_sell = _previous_valid_point(sell_history)
    next_buy = _next_future_point(buy_history)
    next_sell = _next_future_point(sell_history)
    current = round((latest_buy.value + latest_sell.value) / 2, 2)
    snapshot = RateSnapshot(
        current_rate=current,
        official_buy_rate=latest_buy.value,
        official_sell_rate=latest_sell.value,
        previous_official_buy_rate=previous_buy.value,
        previous_official_sell_rate=previous_sell.value,
        next_official_buy_rate=next_buy.value if next_buy else None,
        next_official_sell_rate=next_sell.value if next_sell else None,
        next_effective_date=next_buy.date
        if next_buy
        else next_sell.date
        if next_sell
        else None,
        spread=round(latest_sell.value - latest_buy.value, 4),
        observed_at=max(
            datetime.combine(latest_buy.date, datetime.min.time(), tzinfo=timezone.utc),
            datetime.combine(
                latest_sell.date, datetime.min.time(), tzinfo=timezone.utc
            ),
        ),
    )
    return MarketContext(
        snapshot=snapshot,
        buy_history=buy_history,
        sell_history=sell_history,
        source="live",
    )
