import { useState, useEffect, useCallback } from 'react';
import { getShops, getShopsByRoute } from '../services/shops.service';
import type { Shop } from '../types/database.types';

const MOCK_SHOPS: Shop[] = [
  { id: 's1', organization_id: '1', route_manager_id: 'rm1', name: 'Gopi Kishan Traders', code: 'GKT', address: null, phone: null, is_active: true, sort_order: 1, created_at: '', updated_at: '' },
  { id: 's2', organization_id: '1', route_manager_id: 'rm1', name: 'Masan Kirana',         code: 'MK',  address: null, phone: null, is_active: true, sort_order: 2, created_at: '', updated_at: '' },
  { id: 's3', organization_id: '1', route_manager_id: 'rm2', name: 'Adam Kirana',           code: 'AK',  address: null, phone: null, is_active: true, sort_order: 3, created_at: '', updated_at: '' },
];

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
      if (data.length === 0 && !routeManagerId) {
        setShops(MOCK_SHOPS);
      } else {
        setShops(data);
      }
    } catch (err: any) {
      console.warn('DB fetch failed, using mock shops', err);
      const filtered = routeManagerId
        ? MOCK_SHOPS.filter(s => s.route_manager_id === routeManagerId)
        : MOCK_SHOPS;
      setShops(filtered);
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
