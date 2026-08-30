import { useState, useEffect, useCallback } from 'react';
import { getRouteManagers } from '../services/routeManagers.service';
import type { RouteManager } from '../types/database.types';

const MOCK_ROUTES: RouteManager[] = [
  { id: 'rm1', organization_id: '1', name: 'Route A', phone: null, is_active: true, sort_order: 1, created_at: '', updated_at: '' },
  { id: 'rm2', organization_id: '1', name: 'Route B', phone: null, is_active: true, sort_order: 2, created_at: '', updated_at: '' },
];

export function useRouteManagers(activeOnly = true) {
  const [routeManagers, setRouteManagers] = useState<RouteManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRouteManagers(activeOnly);
      setRouteManagers(data.length > 0 ? data : MOCK_ROUTES);
    } catch (err: any) {
      console.warn('DB fetch failed, using mock route managers', err);
      setRouteManagers(MOCK_ROUTES);
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
