import { useMemo, useState } from 'react';

import { copy } from '../i18n';
import { formatChartDate, formatCurrency } from '../lib/format';
import { HistoryPoint, Locale, Mode } from '../types';

interface MarketChartProps {
  history: HistoryPoint[];
  mode: Mode;
  locale: Locale;
}

type TimeRange = '7d' | '30d' | '90d';

type ChartPoint = {
  date: string;
  axisLabel: string;
  rate: number | null;
  timestamp: string;
};

export function MarketChart({ history, mode, locale }: MarketChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [activePointKey, setActivePointKey] = useState<string | null>(null);

  const data = useMemo<ChartPoint[]>(() => {
    const sliceSize = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

    return history.slice(-sliceSize).map((point) => ({
      date: formatChartDate(point.date, false, locale),
      axisLabel: formatChartDate(point.date, false, locale),
      rate: point.futureDated ? null : point.value,
      timestamp: point.date,
    }));
  }, [history, timeRange, locale]);

  const chartModel = useMemo(() => {
    const validRates = data.flatMap((point) => {
      const values: number[] = [];
      if (typeof point.rate === 'number') values.push(point.rate);
      return values;
    });

    if (validRates.length === 0) {
      return null;
    }

    const width = 960;
    const height = 340;
    const padding = { top: 20, right: 18, bottom: 46, left: 56 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const min = Math.min(...validRates);
    const max = Math.max(...validRates);
    const range = max - min || 1;

    const toX = (index: number) => padding.left + (plotWidth * index) / Math.max(data.length - 1, 1);
    const toY = (value: number) => padding.top + plotHeight - ((value - min) / range) * plotHeight;

    const buildPath = (key: 'rate') => {
      let path = '';

      data.forEach((point, index) => {
        const value = point[key];
        if (typeof value !== 'number') {
          return;
        }

        const x = toX(index);
        const y = toY(value);

        if (!path) {
          path = `M ${x} ${y}`;
          return;
        }

        const previousIndex = index - 1;
        const previousValue = data[previousIndex]?.[key];
        if (typeof previousValue !== 'number') {
          path += ` M ${x} ${y}`;
          return;
        }

        const previousX = toX(previousIndex);
        const previousY = toY(previousValue);
        const controlX = (previousX + x) / 2;
        path += ` C ${controlX} ${previousY}, ${controlX} ${y}, ${x} ${y}`;
      });

      return path;
    };

    const ticks = Array.from({ length: 4 }, (_, index) => {
      const value = min + (range * index) / 3;
      return { value, y: toY(value) };
    });

    let labelIndexes: number[];

    if (timeRange === '90d') {
      const targetLabels = 8;
      const step = Math.max(1, Math.floor((data.length - 1) / (targetLabels - 1)));
      labelIndexes = data
        .map((_, index) => index)
        .filter((index) => index === 0 || index === data.length - 1 || index % step === 0);
    } else {
      const step = data.length <= 8 ? 1 : 3;
      labelIndexes = data
        .map((_, index) => index)
        .filter((index) => index === 0 || index === data.length - 1 || index % step === 0);
    }

    labelIndexes = Array.from(new Set(labelIndexes));

    return {
      width,
      height,
      padding,
      plotWidth,
      plotHeight,
      ticks,
      ratePath: buildPath('rate'),
      labelIndexes,
      toX,
      toY,
    };
  }, [data, timeRange]);

  const rangeSummary = useMemo(() => {
    const visibleRates = data.flatMap((point) => (typeof point.rate === 'number' ? [point] : []));
    if (visibleRates.length === 0) {
      return null;
    }

    const minPoint = visibleRates.reduce((lowest, point) => (point.rate! < lowest.rate! ? point : lowest));
    const maxPoint = visibleRates.reduce((highest, point) => (point.rate! > highest.rate! ? point : highest));

    return {
      min: minPoint,
      max: maxPoint,
    };
  }, [data]);

  const interactivePoints = useMemo(() => {
    if (!chartModel) {
      return [] as Array<{
        key: string;
        x: number;
        y: number;
        value: number;
        label: string;
        isPreview: boolean;
      }>;
    }

    return data.flatMap((point, index) => {
      const points: Array<{
        key: string;
        x: number;
        y: number;
        value: number;
        label: string;
        isPreview: boolean;
      }> = [];

      if (typeof point.rate === 'number') {
        points.push({
          key: `${point.timestamp}-rate`,
          x: chartModel.toX(index),
          y: chartModel.toY(point.rate),
          value: point.rate,
          label: point.date,
          isPreview: false,
        });
      }

        return points;
      });
  }, [chartModel, data]);

  const activePoint = interactivePoints.find((point) => point.key === activePointKey) ?? interactivePoints[interactivePoints.length - 1] ?? null;
  const activeTooltipStyle = activePoint && chartModel
    ? {
        left: `min(max(calc(${(activePoint.x / chartModel.width) * 100}% - 4rem), 1rem), calc(100% - 11rem))`,
        top: `${Math.max(1, ((activePoint.y - 110) / chartModel.height) * 100)}%`,
      }
    : null;

  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white p-5 text-gray-900 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-gray-800 dark:bg-[#0f172a] dark:text-white dark:shadow-[0_20px_60px_rgba(15,23,42,0.35)] sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {mode === 'buy' ? copy[locale].saleChartTitle : copy[locale].purchaseChartTitle}
        </h2>

        <div className="flex gap-2 self-start sm:self-auto">
          {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-all ${
                timeRange === range
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/8 dark:text-slate-300 dark:hover:bg-white/12'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {chartModel ? (
        <div className="w-full overflow-x-auto">
          <div className="mb-4 min-h-16 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/6">
            {activePoint && rangeSummary ? (
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-blue-500 dark:text-blue-300">
                    {mode === 'buy' ? copy[locale].sellPrice : copy[locale].buyPrice}
                  </div>
                  <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    ₡{formatCurrency(activePoint.value, locale)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400">{activePoint.label}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/6">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                      {copy[locale].minimumValue}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                      ₡{formatCurrency(rangeSummary.min.rate ?? 0, locale)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">{rangeSummary.min.date}</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/6">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-300">
                      {copy[locale].maximumValue}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-rose-700 dark:text-rose-200">
                      ₡{formatCurrency(rangeSummary.max.rate ?? 0, locale)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">{rangeSummary.max.date}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-slate-400">{copy[locale].hoverChart}</div>
            )}
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-gray-50 p-2 dark:border-white/10 dark:bg-[#131c2f]">
            <div className="overflow-x-auto">
              <div className="relative w-[720px] min-w-[720px] sm:w-full sm:min-w-0">
                <svg viewBox={`0 0 ${chartModel.width} ${chartModel.height}`} className="h-[400px] w-full sm:h-[360px]" role="img" aria-label="Official exchange rate chart">
              {chartModel.ticks.map((tick) => (
                <g key={tick.value}>
                  <line
                    x1={chartModel.padding.left}
                    x2={chartModel.padding.left + chartModel.plotWidth}
                    y1={tick.y}
                    y2={tick.y}
                    className="stroke-gray-300 dark:stroke-slate-700"
                    strokeDasharray="4 6"
                  />
                  <text
                    x={chartModel.padding.left - 10}
                    y={tick.y + 4}
                    textAnchor="end"
                    fontSize="11"
                    className="fill-slate-500 dark:fill-slate-400"
                  >
                    {formatCurrency(tick.value, locale)}
                  </text>
                </g>
              ))}

              <path
                key={`rate-${timeRange}-${data[data.length - 1]?.timestamp ?? 'empty'}`}
                d={chartModel.ratePath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                pathLength={1}
                className="animate-draw-line"
                style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
              />
              {activePoint ? (
                <line
                  x1={activePoint.x}
                  x2={activePoint.x}
                  y1={chartModel.padding.top}
                  y2={chartModel.padding.top + chartModel.plotHeight}
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />
              ) : null}

              {data.map((point, index) => {
                const x = chartModel.toX(index);
                const startX = index === 0 ? chartModel.padding.left : (chartModel.toX(index - 1) + x) / 2;
                const endX = index === data.length - 1 ? chartModel.padding.left + chartModel.plotWidth : (x + chartModel.toX(index + 1)) / 2;
                const interactive = interactivePoints.find((entry) => entry.key.startsWith(point.timestamp)) ?? null;

                return (
                  <rect
                    key={`zone-${point.timestamp}`}
                    x={startX}
                    y={chartModel.padding.top}
                    width={endX - startX}
                    height={chartModel.plotHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setActivePointKey(interactive?.key ?? null)}
                    onFocus={() => setActivePointKey(interactive?.key ?? null)}
                  />
                );
              })}

              {chartModel.labelIndexes.map((index) => {
                const point = data[index];
                return (
                  <text
                    key={point.timestamp}
                    x={chartModel.toX(index)}
                    y={chartModel.height - 12}
                    textAnchor={index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'}
                    fontSize="11"
                    className="fill-slate-500 dark:fill-slate-400"
                  >
                     {point.axisLabel}
                    </text>
                 );
                })}
                </svg>

                {activePoint ? (
                  <div
                    className="pointer-events-none absolute w-36 rounded-2xl border border-gray-200 bg-white/95 px-3 py-2.5 text-left shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#1e293b]/95 sm:w-40 sm:px-4 sm:py-3"
                    style={activeTooltipStyle ?? undefined}
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
                      {mode === 'buy' ? copy[locale].sellPrice : copy[locale].buyPrice}
                    </div>
                    <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">{activePoint.label}</div>
                    <div className="mt-2 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">₡{formatCurrency(activePoint.value, locale)}</div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
              <span>{mode === 'buy' ? copy[locale].sellPrice : copy[locale].buyPrice}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
