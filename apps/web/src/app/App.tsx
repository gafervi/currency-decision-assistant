import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { RecommendationCircle } from './components/RecommendationCircle';
import { UserInputSection } from './components/UserInputSection';
import { MarketChart } from './components/MarketChart';
import { EntitiesTable } from './components/EntitiesTable';
import { useDashboardData } from './hooks/useDashboardData';
import { Locale, Mode } from './types';
import { copy } from './i18n';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    const savedTheme = window.localStorage.getItem('currency-assistant-theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme === 'dark';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>('buy');
  const [amount, setAmount] = useState(0);
  const [locale, setLocale] = useState<Locale>('es');
  const { state: dashboard, loading, error, hasLoaded } = useDashboardData(mode, amount, locale);

  useEffect(() => {
    setMounted(true);
    const savedLocale = window.localStorage.getItem('currency-assistant-locale');
    if (savedLocale === 'es' || savedLocale === 'en') {
      setLocale(savedLocale);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.localStorage.setItem('currency-assistant-theme', darkMode ? 'dark' : 'light');
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
        <main className="safe-px max-w-7xl mx-auto sm:px-6 lg:px-8 py-6 sm:py-8">
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
        <main className="safe-px max-w-7xl mx-auto sm:px-6 lg:px-8 py-6 sm:py-8">
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
      
      <main className="safe-px max-w-7xl mx-auto sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="mb-8 animate-in fade-in duration-500">
          <RecommendationCircle 
            recommendation={dashboard.recommendation.action}
            currentRate={dashboard.snapshot.currentRate}
            buyRate={dashboard.snapshot.officialBuyRate}
            sellRate={dashboard.snapshot.officialSellRate}
            previousBuyRate={dashboard.snapshot.previousOfficialBuyRate}
            previousSellRate={dashboard.snapshot.previousOfficialSellRate}
            mode={mode}
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
          <MarketChart history={dashboard.history} mode={mode} locale={locale} />
        </div>

        {/* Entities Table */}
        <div className="mb-8 animate-in fade-in duration-500 delay-300">
          <EntitiesTable mode={mode} entities={dashboard.entities} locale={locale} />
        </div>

      </main>

      {/* Footer */}
      <footer className="safe-px safe-pb border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-6 mt-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>{copy[locale].appTitle} • {copy[locale].footer}</p>
          <p className="mt-1">Created by Gabriel Fernandez Vargas</p>
        </div>
      </footer>
    </div>
  );
}
