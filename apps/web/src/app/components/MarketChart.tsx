import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">{payload[0].payload.date}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            ₡{formatCurrency(payload[0].value, locale)}
          </p>
        </div>
      );
    }
    return null;
  };

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

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} key={timeRange}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={darkMode ? '#374151' : '#E5E7EB'} 
          />
          <XAxis 
            dataKey="date" 
            stroke={darkMode ? '#9CA3AF' : '#6B7280'}
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke={darkMode ? '#9CA3AF' : '#6B7280'}
            style={{ fontSize: '12px' }}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="rate" 
            stroke="#3B82F6" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="preview"
            stroke="#7c3aed"
            strokeWidth={2}
            strokeDasharray="6 4"
            connectNulls={false}
            dot={{ r: 5, fill: '#7c3aed' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
