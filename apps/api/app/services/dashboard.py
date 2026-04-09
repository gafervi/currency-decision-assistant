from app.schemas import DashboardResponse
from app.services.entities import get_entities_snapshot
from app.services.history import get_history
from app.services.summary import get_summary


def get_dashboard(mode: str, amount: float, locale: str = "es") -> DashboardResponse:
    summary = get_summary(mode=mode, amount=amount, locale=locale)
    history = get_history(mode=mode)
    entities = get_entities_snapshot(mode=mode)

    return DashboardResponse(
        source=summary.source,
        summary=summary,
        history=history,
        entities=entities,
    )
