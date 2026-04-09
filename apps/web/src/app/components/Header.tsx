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
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {copy[locale].appTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLocale}
              className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-semibold text-gray-700 dark:text-gray-200"
              aria-label="Toggle language"
            >
              {locale === 'es' ? 'ES / EN' : 'EN / ES'}
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
