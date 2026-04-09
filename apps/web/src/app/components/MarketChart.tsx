import { useMemo, useState } from 'react';
import { HistoryPoint, Locale, Mode } from '../types';
import { formatChartDate, formatCurrency } from '../lib/format';
import { copy } from '../i18n';

interface MarketChartProps {
  darkMode: boolean;
  history: HistoryPoint[];
  mode: Mode;
  locale: Locale;
}

type TimeRange = '7d' | '30d' | '90d' | '1y';

export function MarketChart({ darkMode, history, mode, locale }: MarketChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const data = useMemo(() => {
    const sliceSize = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;

    return history
      .slice(-sliceSize)
      .map((point) => ({
        date: formatChartDate(point.date, sliceSize > 60, locale),
        rate: point.futureDated ? null : point.value,
        preview: point.futureDated ? point.value : null,
        futureDated: point.futureDated,
        timestamp: point.date,
      }));
  }, [history, timeRange, locale]);

  const chartModel = useMemo(() => {
    const validRates = data.flatMap((point) => {
      const values: number[] = [];
      if (typeof point.rate === 'number') values.push(point.rate);
      if (typeof point.preview === 'number') values.push(point.preview);
      return values;
    });

    if (validRates.length === 0) {
      return null;
    }

    const width = 880;
    const height = 300;
    const padding = { top: 18, right: 18, bottom: 42, left: 54 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const min = Math.min(...validRates);
    const max = Math.max(...validRates);
    const range = max - min || 1;

    const toX = (index: number) => padding.left + (plotWidth * index) / Math.max(data.length - 1, 1);
    const toY = (value: number) => padding.top + plotHeight - ((value - min) / range) * plotHeight;

    const buildPath = (key: 'rate' | 'preview') => {
      let path = '';
      data.forEach((point, index) => {
        const value = point[key];
        if (typeof value !== 'number') {
          return;
        }
        const x = toX(index);
        const y = toY(value);
        path += path ? ` L ${x} ${y}` : `M ${x} ${y}`;
      });
      return path;
    };

    const ticks = Array.from({ length: 4 }, (_, index) => {
      const value = min + (range * index) / 3;
      return {
        value,
        y: toY(value),
      };
    });

    const labelIndexes = data.length <= 6
      ? data.map((_, index) => index)
      : [0, Math.floor((data.length - 1) / 2), data.length - 1];

    return {
      width,
      height,
      padding,
      plotWidth,
      plotHeight,
      ticks,
      ratePath: buildPath('rate'),
      previewPath: buildPath('preview'),
      labelIndexes,
      toX,
      toY,
    };
  }, [data]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {copy[locale].officialHistory} {mode === 'buy' ? copy[locale].ofSell : copy[locale].ofBuy}
        </h2>
        
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {chartModel ? (
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${chartModel.width} ${chartModel.height}`} className="w-full h-[300px]" role="img" aria-label="Official exchange rate chart">
            {chartModel.ticks.map((tick) => (
              <g key={tick.value}>
                <line
                  x1={chartModel.padding.left}
                  x2={chartModel.padding.left + chartModel.plotWidth}
                  y1={tick.y}
                  y2={tick.y}
                  stroke={darkMode ? '#374151' : '#E5E7EB'}
                  strokeDasharray="4 6"
                />
                <text
                  x={chartModel.padding.left - 10}
                  y={tick.y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill={darkMode ? '#9CA3AF' : '#6B7280'}
                >
                  {formatCurrency(tick.value, locale)}
                </text>
              </g>
            ))}

            <path d={chartModel.ratePath} fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            {chartModel.previewPath ? (
              <path d={chartModel.previewPath} fill="none" stroke="#7c3aed" strokeWidth="3" strokeDasharray="8 6" strokeLinejoin="round" strokeLinecap="round" />
            ) : null}

            {data.map((point, index) => {
              if (typeof point.preview !== 'number') {
                return null;
              }
              const x = chartModel.toX(index);
              const y = chartModel.toY(point.preview);
              return (
                <g key={`preview-${point.timestamp}`}>
                  <circle cx={x} cy={y} r="5" fill="#7c3aed" />
                  <circle cx={x} cy={y} r="10" fill="#7c3aed" opacity="0.15" />
                </g>
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
                  fill={darkMode ? '#9CA3AF' : '#6B7280'}
                >
                  {point.date}
                </text>
              );
            })}
          </svg>

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
              <span>{copy[locale].officialHistory}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-violet-600" />
              <span>{copy[locale].nextDayPreview}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
