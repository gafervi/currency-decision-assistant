from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


Mode = Literal["buy", "sell"]
Action = Literal["buy", "sell", "wait", "partial"]
AmountBand = Literal["small", "medium", "large"]


class RateSnapshot(BaseModel):
    current_rate: float
    official_buy_rate: float
    official_sell_rate: float
    previous_official_buy_rate: float
    previous_official_sell_rate: float
    next_official_buy_rate: float | None = None
    next_official_sell_rate: float | None = None
    next_effective_date: date | None = None
    spread: float
    observed_at: datetime


class InsightItem(BaseModel):
    type: Literal["info", "warning", "success"]
    title: str
    description: str


class RecommendationPayload(BaseModel):
    mode: Mode
    action: Action
    confidence: int = Field(ge=0, le=100)
    amount: float = Field(ge=0)
    amount_band: AmountBand
    rationale: list[str]
    insights: list[InsightItem]


class SummaryResponse(BaseModel):
    mode: Mode
    amount: float = Field(ge=0)
    amount_band: AmountBand
    source: Literal["live", "mock"] = "mock"
    snapshot: RateSnapshot
    recommendation: RecommendationPayload


class HistoryPoint(BaseModel):
    date: date
    value: float
    future_dated: bool = False


class HistoryResponse(BaseModel):
    mode: Mode
    series_code: int
    source: Literal["live", "mock"] = "mock"
    points: list[HistoryPoint]


class EntityQuote(BaseModel):
    id: str
    type: str
    name: str
    buy_price: float
    sell_price: float
    spread: float
    last_updated: datetime
    highlighted_for_mode: bool = False


class EntitiesResponse(BaseModel):
    mode: Mode
    source: Literal["live", "mock"] = "mock"
    entities: list[EntityQuote]


class CatalogIndicator(BaseModel):
    code: int
    name: str
    description: str
    source: str


class CatalogResponse(BaseModel):
    indicators: list[CatalogIndicator]
    notes: list[str]


class RecommendationResponse(BaseModel):
    source: Literal["live", "mock"] = "mock"
    snapshot: RateSnapshot
    recommendation: RecommendationPayload


class DashboardResponse(BaseModel):
    source: Literal["live", "mock"] = "mock"
    summary: SummaryResponse
    history: HistoryResponse
    entities: EntitiesResponse
