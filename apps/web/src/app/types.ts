export type Mode = 'buy' | 'sell';
export type Action = 'buy' | 'sell' | 'wait' | 'partial';
export type AmountBand = 'small' | 'medium' | 'large';
export type Locale = 'es' | 'en';

export interface InsightItem {
  type: 'info' | 'warning' | 'success';
  title: string;
  description: string;
}

export interface RateSnapshot {
  currentRate: number;
  officialBuyRate: number;
  officialSellRate: number;
  spread: number;
  observedAt: string;
}

export interface RecommendationPayload {
  mode: Mode;
  action: Action;
  confidence: number;
  amount: number;
  amountBand: AmountBand;
  rationale: string[];
  insights: InsightItem[];
}

export interface HistoryPoint {
  date: string;
  value: number;
  futureDated: boolean;
}

export interface EntityQuote {
  id: string;
  type: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  lastUpdated: string;
  highlightedForMode: boolean;
}

export interface DashboardState {
  source: 'live' | 'mock';
  snapshot: RateSnapshot;
  recommendation: RecommendationPayload;
  history: HistoryPoint[];
  entities: EntityQuote[];
}
