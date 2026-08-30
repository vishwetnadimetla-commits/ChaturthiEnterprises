import { useState, useEffect, useCallback } from 'react';
import { getRouteManagers } from '../services/routeManagers.service';
import type { RouteManager } from '../types/database.types';

export function useRouteManagers(activeOnly = true) {
  const [routeManagers, setRouteManagers] = useState<RouteManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRouteManagers(activeOnly);
      setRouteManagers(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch route managers:', err);
      setRouteManagers([]);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { routeManagers, loading, error, refetch: fetch };
}
