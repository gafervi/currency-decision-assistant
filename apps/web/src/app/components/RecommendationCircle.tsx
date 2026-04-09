import { Action, AmountBand, HistoryPoint, Locale, Mode } from '../types';
import { formatCurrency, formatDateTime } from '../lib/format';
import { copy, getActionLabel } from '../i18n';
import { getFuturePreview, getSevenDayRange } from '../lib/history';

interface RecommendationCircleProps {
  recommendation: Action;
  confidence: number;
  currentRate: number;
  buyRate: number;
  sellRate: number;
  mode: Mode;
  amountBand: AmountBand;
  source: 'live' | 'mock';
  history: HistoryPoint[];
  locale: Locale;
}

export function RecommendationCircle({ 
  recommendation, 
  confidence, 
  currentRate,
  buyRate,
  sellRate,
  mode,
  amountBand,
  source,
  history,
  locale,
}: RecommendationCircleProps) {
  const getCircleColor = () => {
    switch (recommendation) {
      case 'buy':
        return 'bg-green-500 dark:bg-green-600';
      case 'sell':
        return 'bg-red-500 dark:bg-red-600';
      case 'wait':
        return 'bg-yellow-500 dark:bg-yellow-600';
      case 'partial':
        return 'bg-blue-500 dark:bg-blue-600';
    }
  };

  const getTextColor = () => {
    switch (recommendation) {
      case 'buy':
        return 'text-green-600 dark:text-green-400';
      case 'sell':
        return 'text-red-600 dark:text-red-400';
      case 'wait':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'partial':
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const actionLabel = getActionLabel(locale, recommendation, mode);

  const sevenDayRange = getSevenDayRange(history);
  const futurePreview = getFuturePreview(history);
  const minRate = Math.floor((sevenDayRange?.min ?? Math.min(buyRate, sellRate, currentRate)) - 1);
  const maxRate = Math.ceil((sevenDayRange?.max ?? Math.max(buyRate, sellRate, currentRate)) + 1);
  const position = ((currentRate - minRate) / (maxRate - minRate)) * 100;
  const clampedPosition = Math.min(Math.max(position, 0), 100);
  const futurePosition = futurePreview
    ? Math.min(Math.max(((futurePreview.value - minRate) / (maxRate - minRate)) * 100, 0), 100)
    : null;

  // Get current date and time
  const now = new Date();
  const dateStr = now.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = formatDateTime(now.toISOString(), locale);
  const primaryLabel = mode === 'buy' ? copy[locale].primarySell : copy[locale].primaryBuy;
  const primaryRate = mode === 'buy' ? sellRate : buyRate;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 text-center relative">
      {/* Timestamp in corner */}
      <div className="absolute top-4 right-4 text-right">
        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
          {dateStr}
        </div>
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
          {timeStr}
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className={`w-48 h-48 rounded-full ${getCircleColor()} flex items-center justify-center shadow-2xl mb-6`}>
          <div className="text-center">
            <div className="text-4xl font-bold text-white uppercase">
              {actionLabel}
            </div>
            <div className="text-sm text-white/80 mt-2">
              {confidence}% {copy[locale].confidence}
            </div>
          </div>
        </div>
        
        {/* Rate Indicator Bar */}
        <div className="w-full max-w-md mb-4">
          <div className="relative h-3 bg-gradient-to-r from-red-500 via-orange-400 to-green-500 rounded-full overflow-hidden shadow-inner">
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-gray-900 dark:bg-white shadow-lg transition-all duration-500"
              style={{ left: `${clampedPosition}%` }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-2 py-1 rounded text-xs font-semibold">
                  ₡{formatCurrency(currentRate, locale)}
                </div>
              </div>
            </div>
            {futurePosition !== null && futurePreview && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-violet-600 ring-4 ring-violet-200/70 dark:ring-violet-900/40"
                style={{ left: `${futurePosition}%`, marginLeft: '-6px' }}
                title={`${copy[locale].nextDayPreview}: ${formatCurrency(futurePreview.value, locale)}`}
              />
            )}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>₡{formatCurrency(minRate, locale)}</span>
            <span>₡{formatCurrency(maxRate, locale)}</span>
          </div>
        </div>
        
        <div className="text-gray-600 dark:text-gray-400 text-sm mb-3">
          {copy[locale].currentOfficialReference} {mode === 'buy' ? copy[locale].buyUsd : copy[locale].sellUsd} • {copy[locale].amount} {amountBand}
        </div>
        <div className="text-gray-500 dark:text-gray-500 text-xs mb-4 uppercase tracking-wide">
          {copy[locale].source} {source === 'live' ? copy[locale].liveSource : 'mock'}
        </div>

        <div className="mb-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{primaryLabel}</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">₡{formatCurrency(primaryRate, locale)}</div>
          {sevenDayRange && (
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {copy[locale].sevenDayRange}: ₡{formatCurrency(sevenDayRange.min, locale)} - ₡{formatCurrency(sevenDayRange.max, locale)}
            </div>
          )}
          {futurePreview && (
            <div className="mt-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 px-3 py-2 text-sm text-violet-700 dark:text-violet-300">
              <div className="font-semibold">{copy[locale].nextDayPreview}</div>
              <div>₡{formatCurrency(futurePreview.value, locale)} • {futurePreview.date}</div>
            </div>
          )}
        </div>
        
        {/* Buy and Sell Rates */}
        <div className="grid grid-cols-2 gap-6 mb-2">
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              COMPRA
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ₡{formatCurrency(buyRate, locale)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              VENTA
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              ₡{formatCurrency(sellRate, locale)}
            </div>
          </div>
        </div>
        
        <div className="text-gray-500 dark:text-gray-500 text-xs">
          {copy[locale].updatedAt}: {timeStr}
        </div>
        <p className={`mt-4 text-sm font-medium capitalize ${getTextColor()}`}>
          {copy[locale].recommendationCurrent}: {actionLabel}
        </p>
      </div>
    </div>
  );
}
