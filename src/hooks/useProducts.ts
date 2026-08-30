import { useState, useEffect, useCallback } from 'react';
import { getProductsWithRanges } from '../services/products.service';
import type { ProductWithRanges } from '../types/database.types';

export function useProducts(activeOnly = true) {
  const [products, setProducts] = useState<ProductWithRanges[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProductsWithRanges(activeOnly);
      setProducts(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { products, loading, error, refetch: fetch };
}
