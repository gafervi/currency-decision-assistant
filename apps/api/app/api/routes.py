from fastapi import APIRouter, HTTPException, Query

from app.schemas import (
    CatalogResponse,
    DashboardResponse,
    EntitiesResponse,
    HistoryResponse,
    RecommendationResponse,
    SummaryResponse,
)
from app.services.dashboard import get_dashboard
from app.services.catalog import get_catalog_summary
from app.services.entities import get_entities_snapshot
from app.services.history import get_history
from app.services.recommendations import get_recommendation
from app.services.summary import get_summary


router = APIRouter()


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(
    mode: str = Query("buy", pattern="^(buy|sell)$"),
    amount: float = Query(0, ge=0),
    locale: str = Query("es", pattern="^(es|en)$"),
) -> DashboardResponse:
    try:
        return get_dashboard(mode=mode, amount=amount, locale=locale)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/summary", response_model=SummaryResponse)
def summary(
    mode: str = Query("buy", pattern="^(buy|sell)$"),
    amount: float = Query(0, ge=0),
    locale: str = Query("es", pattern="^(es|en)$"),
) -> SummaryResponse:
    try:
        return get_summary(mode=mode, amount=amount, locale=locale)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/history", response_model=HistoryResponse)
def history(mode: str = Query("buy", pattern="^(buy|sell)$")) -> HistoryResponse:
    try:
        return get_history(mode=mode)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/entities", response_model=EntitiesResponse)
def entities(mode: str = Query("buy", pattern="^(buy|sell)$")) -> EntitiesResponse:
    try:
        return get_entities_snapshot(mode=mode)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/recommendation", response_model=RecommendationResponse)
def recommendation(
    mode: str = Query("buy", pattern="^(buy|sell)$"),
    amount: float = Query(0, ge=0),
    locale: str = Query("es", pattern="^(es|en)$"),
) -> RecommendationResponse:
    try:
        return get_recommendation(mode=mode, amount=amount, locale=locale)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/catalog", response_model=CatalogResponse)
def catalog() -> CatalogResponse:
    return get_catalog_summary()
