import { DollarSign, TrendingUp } from 'lucide-react';
import { RecommendationPayload, Locale, Mode } from '../types';
import { formatCurrency } from '../lib/format';
import { copy, getActionLabel } from '../i18n';

interface UserInputSectionProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  amount: number;
  onAmountChange: (amount: number) => void;
  currentRate: number;
  recommendation: RecommendationPayload;
  source: 'live' | 'mock';
  loading: boolean;
  locale: Locale;
}

export function UserInputSection({
  mode,
  onModeChange,
  amount,
  onAmountChange,
  currentRate,
  recommendation,
  source,
  loading,
  locale,
}: UserInputSectionProps) {
  const presets = mode === 'buy'
    ? [250, 500, 1000, 2000, 5000]
    : [100000, 250000, 500000, 1000000, 2500000];

  const getSuggestion = () => {
    if (mode === 'buy' && amount > 0) {
      const estimatedCrc = amount * currentRate;
      return locale === 'es'
        ? `Para comprar $${amount.toLocaleString()} USD, el costo estimado ronda ₡${formatCurrency(estimatedCrc, locale)}.`
        : `Buying $${amount.toLocaleString()} USD would cost about CRC ${formatCurrency(estimatedCrc, locale)}.`;
    }
    if (mode === 'sell' && amount > 0) {
      const estimatedUsd = amount / currentRate;
      return locale === 'es'
        ? `Si quieres recibir ₡${amount.toLocaleString('es-CR')} CRC, necesitarias vender cerca de $${estimatedUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD.`
        : `To receive CRC ${amount.toLocaleString('en-US')}, you would need to sell about $${estimatedUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD.`;
    }
    return copy[locale].enterAmountHint;
  };

  const getRecommendationColor = () => {
    switch (recommendation.action) {
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

  const amountLabel = mode === 'buy' ? copy[locale].usdAmount : copy[locale].crcAmount;
  const amountPrefix = mode === 'buy' ? '$' : '₡';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {copy[locale].decisionContext}
        </h2>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => onModeChange('buy')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'buy'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          {copy[locale].buyMode}
        </button>
        <button
          onClick={() => onModeChange('sell')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'sell'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          {copy[locale].sellMode}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {amountLabel}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{amountPrefix}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => onAmountChange(Number(e.target.value) || 0)}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {presets.map((preset) => (
              <button
                key={preset}
                onClick={() => onAmountChange(preset)}
                className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {amountPrefix}{preset.toLocaleString(mode === 'buy' ? 'en-US' : 'es-CR')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="h-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 p-4">
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
              <DollarSign className="w-4 h-4" />
              {copy[locale].amountPersonalization}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
              {recommendation.amountBand}
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {copy[locale].amountBandHelper}
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              {loading ? `${copy[locale].refreshing}...` : source === 'live' ? copy[locale].backendLive : 'mock'}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {recommendation.rationale.map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className={`w-5 h-5 mt-0.5 ${getRecommendationColor()}`} />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              {copy[locale].recommendationMain}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getSuggestion()}
            </p>
            <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
              {copy[locale].suggestedAction}: <span className={`font-semibold capitalize ${getRecommendationColor()}`}>{getActionLabel(locale, recommendation.action, mode)}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
