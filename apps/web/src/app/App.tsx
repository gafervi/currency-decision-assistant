import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { RecommendationCircle } from './components/RecommendationCircle';
import { UserInputSection } from './components/UserInputSection';
import { MarketChart } from './components/MarketChart';
import { EntitiesTable } from './components/EntitiesTable';
import { InsightsSection } from './components/InsightsSection';
import { useDashboardData } from './hooks/useDashboardData';
import { Locale, Mode } from './types';
import { copy } from './i18n';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>('buy');
  const [amount, setAmount] = useState(1000);
  const [locale, setLocale] = useState<Locale>('es');
  const { state: dashboard, loading, error, hasLoaded } = useDashboardData(mode, amount, locale);

  useEffect(() => {
    setMounted(true);
    const savedLocale = window.localStorage.getItem('currency-assistant-locale');
    if (savedLocale === 'es' || savedLocale === 'en') {
      setLocale(savedLocale);
    }
    // Apply dark mode class to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleLocale = () => {
    setLocale((current) => {
      const next = current === 'es' ? 'en' : 'es';
      window.localStorage.setItem('currency-assistant-locale', next);
      return next;
    });
  };

  if (!hasLoaded && loading) {
    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} locale={locale} toggleLocale={toggleLocale} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-10 text-center text-gray-600 dark:text-gray-400">
            {copy[locale].loading}
          </div>
        </main>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} locale={locale} toggleLocale={toggleLocale} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-10 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{copy[locale].liveErrorTitle}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{error ?? 'Unknown error'}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} locale={locale} toggleLocale={toggleLocale} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8 animate-in fade-in duration-500">
          <RecommendationCircle 
            recommendation={dashboard.recommendation.action}
            confidence={dashboard.recommendation.confidence}
            currentRate={dashboard.snapshot.currentRate}
            buyRate={dashboard.snapshot.officialBuyRate}
            sellRate={dashboard.snapshot.officialSellRate}
            mode={mode}
            amountBand={dashboard.recommendation.amountBand}
            source={dashboard.source}
            history={dashboard.history}
            locale={locale}
          />
        </div>

        {/* User Input Section */}
        <div className="mb-8 animate-in fade-in duration-500 delay-100">
          <UserInputSection 
            mode={mode}
            onModeChange={setMode}
            amount={amount}
            onAmountChange={setAmount}
            currentRate={dashboard.snapshot.currentRate}
            recommendation={dashboard.recommendation}
            source={dashboard.source}
            loading={loading}
            locale={locale}
          />
        </div>

        {/* Market Chart */}
        <div className="mb-8 animate-in fade-in duration-500 delay-200">
          <MarketChart darkMode={darkMode} history={dashboard.history} mode={mode} locale={locale} />
        </div>

        {/* Entities Table */}
        <div className="mb-8 animate-in fade-in duration-500 delay-300">
          <EntitiesTable mode={mode} entities={dashboard.entities} locale={locale} />
        </div>

        {/* Insights Section */}
        <div className="mb-8 animate-in fade-in duration-500 delay-400">
          <InsightsSection insights={dashboard.recommendation.insights} locale={locale} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>{copy[locale].appTitle} • {copy[locale].footer}</p>
          <p className="mt-1">{copy[locale].readOnlyMode}{loading ? ` • ${copy[locale].refreshing}` : ''}</p>
        </div>
      </footer>
    </div>
  );
}
