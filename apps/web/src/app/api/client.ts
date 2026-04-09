import {
  DashboardState,
  EntityQuote,
  HistoryPoint,
  Mode,
  RecommendationPayload,
  RateSnapshot,
} from '../types';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';


interface SummaryApiResponse {
  source: 'live' | 'mock';
  snapshot: {
    current_rate: number;
    official_buy_rate: number;
    official_sell_rate: number;
    spread: number;
    observed_at: string;
  };
  recommendation: {
    mode: Mode;
    action: RecommendationPayload['action'];
    confidence: number;
    amount: number;
    amount_band: RecommendationPayload['amountBand'];
    rationale: string[];
    insights: RecommendationPayload['insights'];
  };
}


interface HistoryApiResponse {
  source: 'live' | 'mock';
  points: Array<{
    date: string;
    value: number;
    future_dated: boolean;
  }>;
}


interface EntitiesApiResponse {
  source: 'live' | 'mock';
  entities: Array<{
    id: string;
    type: string;
    name: string;
    buy_price: number;
    sell_price: number;
    spread: number;
    last_updated: string;
    highlighted_for_mode: boolean;
  }>;
}


interface ApiErrorResponse {
  detail?: string;
}


interface DashboardApiResponse {
  source: 'live' | 'mock';
  summary: SummaryApiResponse;
  history: HistoryApiResponse;
  entities: EntitiesApiResponse;
}


function mapSnapshot(snapshot: SummaryApiResponse['snapshot']): RateSnapshot {
  return {
    currentRate: snapshot.current_rate,
    officialBuyRate: snapshot.official_buy_rate,
    officialSellRate: snapshot.official_sell_rate,
    spread: snapshot.spread,
    observedAt: snapshot.observed_at,
  };
}


function mapRecommendation(
  recommendation: SummaryApiResponse['recommendation'],
): RecommendationPayload {
  return {
    mode: recommendation.mode,
    action: recommendation.action,
    confidence: recommendation.confidence,
    amount: recommendation.amount,
    amountBand: recommendation.amount_band,
    rationale: recommendation.rationale,
    insights: recommendation.insights,
  };
}


function mapHistory(points: HistoryApiResponse['points']): HistoryPoint[] {
  return points.map((point) => ({
    date: point.date,
    value: point.value,
    futureDated: point.future_dated,
  }));
}


function mapEntities(entities: EntitiesApiResponse['entities']): EntityQuote[] {
  return entities.map((entity) => ({
    id: entity.id,
    type: entity.type,
    name: entity.name,
    buyPrice: entity.buy_price,
    sellPrice: entity.sell_price,
    spread: entity.spread,
    lastUpdated: entity.last_updated,
    highlightedForMode: entity.highlighted_for_mode,
  }));
}


async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(errorBody.detail || `Request failed for ${path}: ${response.status}`);
  }
  return response.json() as Promise<T>;
}


export async function loadDashboard(mode: Mode, amount: number, locale: 'es' | 'en'): Promise<DashboardState> {
  const dashboard = await getJson<DashboardApiResponse>(
    `/dashboard?mode=${mode}&amount=${amount}&locale=${locale}`,
  );

  return {
    source: dashboard.source,
    snapshot: mapSnapshot(dashboard.summary.snapshot),
    recommendation: mapRecommendation(dashboard.summary.recommendation),
    history: mapHistory(dashboard.history.points),
    entities: mapEntities(dashboard.entities.entities),
  };
}
