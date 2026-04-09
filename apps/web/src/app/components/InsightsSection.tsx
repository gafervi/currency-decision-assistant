import { AlertCircle, TrendingUp, Bell, Activity } from 'lucide-react';
import { InsightItem, Locale } from '../types';
import { copy } from '../i18n';

const icons = {
  warning: AlertCircle,
  info: Activity,
  success: TrendingUp,
};

interface InsightsSectionProps {
  insights: InsightItem[];
  locale: Locale;
}

export function InsightsSection({ insights, locale }: InsightsSectionProps) {

  const getInsightStyles = (type: InsightItem['type']) => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400';
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {copy[locale].marketInsights}
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">{copy[locale].marketReady}</span>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => {
          const Icon = icons[insight.type];
          const styles = getInsightStyles(insight.type);
          
          return (
            <div
              key={`${insight.type}-${insight.title}`}
              className={`border rounded-lg p-4 ${styles}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium mb-1">{insight.title}</h3>
                  <p className="text-sm opacity-90">{insight.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
