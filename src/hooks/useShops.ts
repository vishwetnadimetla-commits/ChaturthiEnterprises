import { useState, useEffect, useCallback } from 'react';
import { getShops, getShopsByRoute } from '../services/shops.service';
import type { Shop } from '../types/database.types';

export function useShops(activeOnly = true, routeManagerId?: string) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      let data: Shop[];
      if (routeManagerId) {
        data = await getShopsByRoute(routeManagerId, activeOnly);
      } else {
        data = await getShops(activeOnly);
      }
      setShops(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch shops:', err);
      setShops([]);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [activeOnly, routeManagerId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { shops, loading, error, refetch: fetch };
}
