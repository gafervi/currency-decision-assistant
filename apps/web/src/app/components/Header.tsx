import { Sun, Moon } from 'lucide-react';
import { Locale } from '../types';
import { copy } from '../i18n';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  locale: Locale;
  toggleLocale: () => void;
}

export function Header({ darkMode, toggleDarkMode, locale, toggleLocale }: HeaderProps) {
  const nextLocaleLabel = locale === 'es' ? 'EN' : 'ES';

  return (
    <header className="safe-pt safe-px border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto sm:px-2 lg:px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              {copy[locale].appTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLocale}
              className="group relative min-w-10 overflow-hidden rounded-lg bg-gray-100 px-2.5 py-2 text-xs font-semibold text-gray-700 transition-all duration-300 hover:bg-gray-200 sm:min-w-14 sm:px-3 sm:text-sm dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              aria-label="Toggle language"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span
                key={nextLocaleLabel}
                className="relative block animate-[fade-slide-in_220ms_ease-out]"
              >
                {nextLocaleLabel}
              </span>
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
