from app.schemas import SummaryResponse
from app.services.bands import classify_amount
from app.services.market_data import get_market_context
from app.services.recommendations import get_recommendation_payload
from app.services.snapshot_view import get_mode_snapshot


def get_summary(mode: str, amount: float, locale: str = "es") -> SummaryResponse:
    context = get_market_context()
    return SummaryResponse(
        mode=mode,
        amount=amount,
        amount_band=classify_amount(mode=mode, amount=amount),
        source=context.source,
        snapshot=get_mode_snapshot(mode, context.snapshot),
        recommendation=get_recommendation_payload(
            mode=mode, amount=amount, context=context, locale=locale
        ),
    )
