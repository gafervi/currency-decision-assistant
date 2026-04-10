import { useEffect, useRef, useState } from 'react';

import { HelpCircle, TrendingUp } from 'lucide-react';
import { RecommendationPayload, Locale, Mode, HistoryPoint } from '../types';
import { formatChartDate, formatCurrency } from '../lib/format';
import { copy, getActionLabel } from '../i18n';

interface UserInputSectionProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  amount: number;
  onAmountChange: (amount: number) => void;
  currentRate: number;
  history: HistoryPoint[];
  nextBuyRate: number | null;
  nextSellRate: number | null;
  nextEffectiveDate: string | null;
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
  history,
  nextBuyRate,
  nextSellRate,
  nextEffectiveDate,
  recommendation,
  source,
  loading,
  locale,
}: UserInputSectionProps) {
  const maxAmount = 999999999999999;
  const [amountInput, setAmountInput] = useState(String(amount));
  const [showActionHelp, setShowActionHelp] = useState(false);
  const actionHelpRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setAmountInput(String(amount));
  }, [amount]);

  const handleAmountChange = (value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    const firstDotIndex = sanitized.indexOf('.');
    const normalized = firstDotIndex === -1
      ? sanitized
      : `${sanitized.slice(0, firstDotIndex + 1)}${sanitized.slice(firstDotIndex + 1).replace(/\./g, '')}`;

    if (normalized === '') {
      setAmountInput('');
      onAmountChange(0);
      return;
    }

    setAmountInput(normalized);

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) {
      return;
    }

    const nextAmount = Math.min(parsed, maxAmount);
    if (nextAmount !== parsed) {
      setAmountInput(String(nextAmount));
    }
    onAmountChange(nextAmount);
  };

  const getSuggestion = () => {
    if (mode === 'buy' && amount > 0) {
      const estimatedUsd = amount / currentRate;
      return locale === 'es'
        ? `Si tienes ₡${formatCurrency(amount, locale)} colones, podrias comprar cerca de $${estimatedUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD.`
        : `If you have CRC ${formatCurrency(amount, locale)}, you could buy about $${estimatedUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD.`;
    }
    if (mode === 'sell' && amount > 0) {
      const estimatedCrc = amount * currentRate;
      return locale === 'es'
        ? `Si tienes $${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD, recibirias cerca de ₡${formatCurrency(estimatedCrc, locale)} colones.`
        : `If you have $${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD, you would receive about CRC ${formatCurrency(estimatedCrc, locale)}.`;
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

  const actionLabel = getActionLabel(locale, recommendation.action, mode);
  const actionHelpText = recommendation.action === 'partial'
    ? mode === 'buy' ? copy[locale].helpPartialBuy : copy[locale].helpPartialSell
    : recommendation.action === 'buy'
      ? copy[locale].helpBuy
      : recommendation.action === 'sell'
        ? copy[locale].helpSell
        : copy[locale].helpWait;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (actionHelpRef.current && !actionHelpRef.current.contains(target)) {
        setShowActionHelp(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  const amountLabel = mode === 'buy' ? copy[locale].crcAmount : copy[locale].usdAmount;
  const amountPrefix = mode === 'buy' ? '₡' : '$';
  const fallbackTomorrowPoint = history.find((point) => point.futureDated) ?? null;
  const resolvedNextBuyRate = nextBuyRate ?? (mode === 'sell' ? fallbackTomorrowPoint?.value ?? null : null);
  const resolvedNextSellRate = nextSellRate ?? (mode === 'buy' ? fallbackTomorrowPoint?.value ?? null : null);
  const resolvedNextEffectiveDate = nextEffectiveDate ?? fallbackTomorrowPoint?.date ?? null;
  const tomorrowPreviewVisible = resolvedNextBuyRate !== null && resolvedNextSellRate !== null && resolvedNextEffectiveDate !== null;
  const modeButtons = [
    { value: 'sell' as const, label: copy[locale].sellMode, activeClassName: 'bg-red-500 text-white' },
    { value: 'buy' as const, label: copy[locale].buyMode, activeClassName: 'bg-green-500 text-white' },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {copy[locale].decisionContext}
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">
            {modeButtons.map((button) => (
              <button
                key={button.value}
                onClick={() => onModeChange(button.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === button.value
                    ? button.activeClassName
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      <div className="mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {amountLabel}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{amountPrefix}</span>
            <input
              type="text"
              inputMode="decimal"
              value={amountInput}
              onFocus={() => {
                if (amountInput === '0') {
                  setAmountInput('');
                }
              }}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={copy[locale].amountPlaceholder}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {getSuggestion()}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className={`w-5 h-5 mt-0.5 ${getRecommendationColor()}`} />
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              {copy[locale].recommendationMain}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>{copy[locale].suggestedAction}:</span>
              <div ref={actionHelpRef} className="relative inline-flex">
                <button
                  type="button"
                  onClick={() => setShowActionHelp((current) => !current)}
                  className={`inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-semibold capitalize ${getRecommendationColor()} dark:bg-gray-900`}
                >
                  <span>{actionLabel}</span>
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
                {showActionHelp ? (
                  <div className="absolute left-0 top-full z-10 mt-2 w-64 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-600 shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                    <div className="font-semibold text-gray-900 dark:text-white">{actionLabel}</div>
                    <p className="mt-2">{actionHelpText}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {tomorrowPreviewVisible ? (
        <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-900/40 dark:bg-violet-900/20">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
            {copy[locale].tomorrowPreview}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm sm:max-w-sm">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-violet-600 dark:text-violet-300">{copy[locale].buyPrice}</div>
              <div className="font-semibold text-violet-900 dark:text-violet-100">₡{formatCurrency(resolvedNextBuyRate ?? 0, locale)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-violet-600 dark:text-violet-300">{copy[locale].sellPrice}</div>
              <div className="font-semibold text-violet-900 dark:text-violet-100">₡{formatCurrency(resolvedNextSellRate ?? 0, locale)}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-violet-700 dark:text-violet-300">
            {copy[locale].effectiveOn} {formatChartDate(resolvedNextEffectiveDate ?? '', false, locale)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
