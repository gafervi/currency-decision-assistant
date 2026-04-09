import { startTransition, useEffect, useState } from 'react';

import { loadDashboard } from '../api/client';
import { DashboardState, Locale, Mode } from '../types';


export function useDashboardData(mode: Mode, amount: number, locale: Locale) {
  const [state, setState] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    loadDashboard(mode, amount, locale)
      .then((nextState) => {
        if (!active) {
          return;
        }

        startTransition(() => {
          setState(nextState);
        });
      })
      .catch((nextError: Error) => {
        if (active) {
          setError(nextError.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [mode, amount, locale]);

  return { state, loading, error, hasLoaded: state !== null };
}
