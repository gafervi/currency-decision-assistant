import { useState } from 'react';
import { TrendingUp, TrendingDown, Building2 } from 'lucide-react';
import { EntityQuote, Locale, Mode } from '../types';
import { formatCurrency, formatDateTime } from '../lib/format';
import { copy } from '../i18n';

interface EntitiesTableProps {
  mode: Mode;
  entities: EntityQuote[];
  locale: Locale;
}

export function EntitiesTable({ mode, entities, locale }: EntitiesTableProps) {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'bestBuy' | 'bestSell' | 'name'>('bestSell');
  const typeOptions = Array.from(new Set(entities.map((entity) => entity.type))).sort();

  const filteredEntities = entities.filter(entity => 
    filter === 'all' || entity.type === filter
  );

  const sortedEntities = [...filteredEntities].sort((a, b) => {
    switch (sortBy) {
      case 'bestBuy':
        return b.buyPrice - a.buyPrice; // Higher buy price is better for selling CRC
      case 'bestSell':
        return a.sellPrice - b.sellPrice; // Lower sell price is better for buying CRC
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const bestBuyPrice = Math.max(...entities.map(e => e.buyPrice));
  const bestSellPrice = Math.min(...entities.map(e => e.sellPrice));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-5 h-5" />
            {copy[locale].entitiesTitle}
        </h2>
        
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">{copy[locale].allTypes}</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
              <option value="bestBuy">{copy[locale].bestBuy}</option>
              <option value="bestSell">{copy[locale].bestSell}</option>
              <option value="name">{copy[locale].name}</option>
          </select>
        </div>
      </div>

      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {mode === 'buy'
          ? copy[locale].buyTableHint
          : copy[locale].sellTableHint}
      </p>

      <p className="mb-4 text-xs text-gray-500 dark:text-gray-500 break-all">
        {copy[locale].entitiesSource}: https://gee.bccr.fi.cr/IndicadoresEconomicos/Cuadros/frmConsultaTCVentanilla.aspx
      </p>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">{copy[locale].entityType}</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">{copy[locale].authorizedEntity}</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">{copy[locale].buyPrice}</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">{copy[locale].sellPrice}</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">{copy[locale].spread}</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">{copy[locale].lastUpdated}</th>
            </tr>
          </thead>
          <tbody>
            {sortedEntities.map((entity) => {
              const isBestBuy = entity.buyPrice === bestBuyPrice;
              const isBestSell = entity.sellPrice === bestSellPrice;
              
              return (
                <tr 
                  key={entity.id} 
                  className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                    entity.highlightedForMode || isBestBuy || isBestSell ? 'bg-green-50 dark:bg-green-900/10' : ''
                  }`}
                >
                  <td className="py-3 px-4 align-top">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{entity.type}</span>
                  </td>
                  <td className="py-3 px-4 align-top">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">{entity.name}</span>
                        {(entity.highlightedForMode || isBestBuy || isBestSell) && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                            {copy[locale].featured}
                          </span>
                        )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right align-top">
                     <div className="flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="font-medium text-gray-900 dark:text-white">₡{formatCurrency(entity.buyPrice, locale)}</span>
                      </div>
                    </td>
                  <td className="py-3 px-4 text-right align-top">
                     <div className="flex items-center justify-end gap-1">
                        <TrendingDown className="w-3 h-3 text-red-500" />
                        <span className="font-medium text-gray-900 dark:text-white">₡{formatCurrency(entity.sellPrice, locale)}</span>
                      </div>
                    </td>
                  <td className="py-3 px-4 text-right align-top">
                    <span className="font-medium text-gray-900 dark:text-white">₡{formatCurrency(entity.spread, locale)}</span>
                  </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-500 dark:text-gray-500 align-top">
                      {formatDateTime(entity.lastUpdated, locale)}
                    </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
