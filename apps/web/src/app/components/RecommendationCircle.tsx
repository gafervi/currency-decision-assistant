import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { Action, HistoryPoint, Locale, Mode } from '../types';
import { formatCurrency, formatDateTime } from '../lib/format';
import { copy, getActionLabel } from '../i18n';
import { getSevenDayRange } from '../lib/history';

interface RecommendationCircleProps {
  recommendation: Action;
  currentRate: number;
  buyRate: number;
  sellRate: number;
  previousBuyRate: number;
  previousSellRate: number;
  mode: Mode;
  history: HistoryPoint[];
  locale: Locale;
}

export function RecommendationCircle({
  recommendation,
  currentRate,
  buyRate,
  sellRate,
  previousBuyRate,
  previousSellRate,
  mode,
  history,
  locale,
}: RecommendationCircleProps) {
  const [showRangeTooltip, setShowRangeTooltip] = useState(false);
  const rangeRef = useRef<HTMLDivElement | null>(null);
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
  const circleLabel = recommendation === 'buy' || recommendation === 'sell'
    ? copy[locale].favorable
    : actionLabel;

  const sevenDayRange = getSevenDayRange(history);
  const minRate = sevenDayRange ? sevenDayRange.min : Math.min(currentRate, buyRate, sellRate);
  const maxRate = sevenDayRange ? sevenDayRange.max : Math.max(currentRate, buyRate, sellRate);
  const scaleRange = maxRate - minRate || 1;
  const position = ((currentRate - minRate) / scaleRange) * 100;
  const clampedPosition = Math.min(Math.max(position, 0), 100);
  // Get current date and time
  const now = new Date();
  const dateStr = now.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = formatDateTime(now.toISOString(), locale);
  const rangeTooltip = useMemo(() => {
    if (!sevenDayRange) {
      return null;
    }

    return `${copy[locale].sevenDayRange}: ₡${formatCurrency(minRate, locale)} - ₡${formatCurrency(maxRate, locale)}`;
  }, [locale, maxRate, minRate, sevenDayRange]);

  const scaleGradient = 'from-red-500 via-amber-400 to-green-500';

  const rateCards = [
    {
      label: 'COMPRA',
      current: buyRate,
      previous: previousBuyRate,
    },
    {
      label: 'VENTA',
      current: sellRate,
      previous: previousSellRate,
    },
  ].map((item) => {
    const delta = item.current - item.previous;
    const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

    return {
      ...item,
      delta,
      direction,
      valueClassName:
        direction === 'up'
          ? 'text-emerald-400'
          : direction === 'down'
            ? 'text-rose-400'
            : 'text-slate-100',
      metaClassName:
        direction === 'up'
          ? 'text-emerald-300/90'
          : direction === 'down'
            ? 'text-rose-300/90'
            : 'text-slate-400',
    };
  });

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (rangeRef.current && !rangeRef.current.contains(target)) {
        setShowRangeTooltip(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-5 sm:p-8 text-center relative overflow-hidden">
      {/* Timestamp in corner */}
      <div className="absolute top-4 right-4 text-right hidden sm:block">
        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
          {dateStr}
        </div>
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
          {timeStr}
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="mb-6 flex w-full flex-col items-center gap-4">
          <div className={`animate-breathe-ring relative flex h-36 w-36 items-center justify-center rounded-full ${getCircleColor()} shadow-2xl ring-8 ring-white/40 dark:ring-white/10 sm:h-40 sm:w-40`}>
            <div className="absolute inset-4 rounded-full border border-white/20" />
            <div className="px-5 text-center">
              <div className="text-xl font-bold leading-tight text-white sm:text-2xl">
                {circleLabel}
              </div>
            </div>
          </div>

          <div ref={rangeRef} className="relative w-full max-w-[420px] pt-1">
            <div className="relative h-16">
              <div className="absolute inset-x-4 top-0 bottom-0">
                <div className={`absolute inset-x-0 top-6 h-3 rounded-full bg-gradient-to-r ${scaleGradient} shadow-inner`} />
                <div
                  className="absolute top-3 h-9 w-1 rounded-full bg-gray-900 shadow-lg dark:bg-white"
                  style={{ left: `${clampedPosition}%`, transform: 'translateX(-50%)' }}
                />
                <div
                  className="absolute top-0 rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-900 shadow-lg dark:bg-gray-950 dark:text-white"
                  style={{ left: `${clampedPosition}%`, transform: 'translateX(-50%)' }}
                >
                  ₡{formatCurrency(currentRate, locale)}
                </div>
              </div>
            </div>

            <div className="-mt-1 flex justify-between px-4 text-xs font-medium text-gray-500 dark:text-gray-400">
              <span>₡{formatCurrency(minRate, locale)}</span>
              <span>₡{formatCurrency(maxRate, locale)}</span>
            </div>

            {rangeTooltip ? (
              <button
                type="button"
                onClick={() => setShowRangeTooltip((current) => !current)}
                className="absolute inset-0"
                aria-label={copy[locale].sevenDayRange}
              />
            ) : null}

            {rangeTooltip && showRangeTooltip ? (
              <div className="absolute bottom-0 left-1/2 z-10 w-max max-w-[calc(100%-1rem)] -translate-x-1/2 rounded-full border border-gray-200 bg-white/95 px-4 py-1.5 text-xs text-gray-600 shadow-lg dark:border-gray-800 dark:bg-gray-900/95 dark:text-gray-300">
                {rangeTooltip}
              </div>
            ) : null}
          </div>
        </div>

        {/* Buy and Sell Rates */}
        <div className="mb-2 grid w-full max-w-[520px] grid-cols-2 gap-3 rounded-[1.75rem] border border-gray-200 bg-gray-50 px-5 py-4 text-center shadow-[0_18px_48px_rgba(15,23,42,0.08)] dark:border-gray-800 dark:bg-[#111827] dark:shadow-[0_18px_48px_rgba(15,23,42,0.28)]">
          {rateCards.map((rate) => {
            const TrendIcon = rate.direction === 'up' ? ChevronUp : rate.direction === 'down' ? ChevronDown : null;

            return (
              <div key={rate.label} className="flex min-w-0 flex-col items-center">
                <div className="text-[11px] font-medium tracking-[0.2em] text-gray-500 dark:text-slate-400">
                  {rate.label}
                </div>
                <div className="mt-2 flex items-start justify-center gap-2">
                  {TrendIcon ? (
                    <TrendIcon className={`mt-1 h-4 w-4 shrink-0 ${rate.metaClassName}`} strokeWidth={2.4} />
                  ) : (
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400 dark:bg-slate-500" />
                  )}
                  <div className="min-w-0 text-center">
                    <div className={`text-[2rem] font-semibold leading-none tracking-[-0.04em] ${rate.direction === 'flat' ? 'text-gray-900 dark:text-slate-100' : rate.valueClassName}`}>
                      ₡{formatCurrency(rate.current, locale)}
                    </div>
                    <div className={`mt-2 text-xs text-gray-900 ${
                      rate.direction === 'up'
                        ? 'dark:text-emerald-300/90'
                        : rate.direction === 'down'
                          ? 'dark:text-rose-300/90'
                          : 'dark:text-slate-400'
                    }`}>
                      {copy[locale].previousDay} ₡{formatCurrency(rate.previous, locale)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
