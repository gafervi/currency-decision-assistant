from app.core.config import get_settings
from app.schemas import HistoryPoint, HistoryResponse
from app.services.market_data import get_market_context


def get_history(mode: str) -> HistoryResponse:
    settings = get_settings()
    context = get_market_context()
    points: list[HistoryPoint] = (
        context.sell_history if mode == "buy" else context.buy_history
    )

    return HistoryResponse(
        mode=mode,
        series_code=settings.bccr_indicator_sell
        if mode == "buy"
        else settings.bccr_indicator_buy,
        source=context.source,
        points=points,
    )
