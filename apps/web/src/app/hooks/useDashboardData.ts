import { startTransition, useEffect, useState } from 'react';

import { loadDashboard } from '../api/client';
import { DashboardState, Locale, Mode } from '../types';


export function useDashboardData(mode: Mode, amount: number, locale: Locale) {
  const [state, setState] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchDashboard = async (isInitialLoad: boolean) => {
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);

      try {
        const nextState = await loadDashboard(mode, amount, locale);
        if (!active) {
          return;
        }

        startTransition(() => {
          setState(nextState);
        });
      } catch (nextError) {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : 'Load failed');
        }
      } finally {
        if (active && isInitialLoad) {
          setLoading(false);
        }
      }
    };

    void fetchDashboard(true);
    const interval = window.setInterval(() => {
      void fetchDashboard(false);
    }, 60000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [mode, amount, locale]);

  return { state, loading, error, hasLoaded: state !== null };
}
