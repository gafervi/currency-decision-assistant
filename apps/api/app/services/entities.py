from app.schemas import EntitiesResponse
from app.services.ventanilla import get_live_entities


def get_entities_snapshot(mode: str) -> EntitiesResponse:
    return get_live_entities(mode)
