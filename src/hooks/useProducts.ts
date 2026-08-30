import { useState, useEffect, useCallback } from 'react';
import { getProductsWithRanges } from '../services/products.service';
import type { ProductWithRanges } from '../types/database.types';

const MOCK_PRODUCTS: ProductWithRanges[] = [
  {
    id: 'p1', organization_id: '1', name: 'Toned Milk', short_name: 'TM',
    description: null, is_active: true, sort_order: 1, created_at: '', updated_at: '',
    product_ranges: [
      { id: 'r1', product_id: 'p1', label: '140 ml', quantity: 140, unit: 'ML', litres_per_unit: 0.140, is_active: true, sort_order: 1, created_at: '', updated_at: '' },
      { id: 'r2', product_id: 'p1', label: '250 ml', quantity: 250, unit: 'ML', litres_per_unit: 0.250, is_active: true, sort_order: 2, created_at: '', updated_at: '' },
    ]
  },
  {
    id: 'p2', organization_id: '1', name: 'Standardised Milk', short_name: 'SM',
    description: null, is_active: true, sort_order: 2, created_at: '', updated_at: '',
    product_ranges: [
      { id: 'r3', product_id: 'p2', label: '250 ml', quantity: 250, unit: 'ML', litres_per_unit: 0.250, is_active: true, sort_order: 1, created_at: '', updated_at: '' },
      { id: 'r4', product_id: 'p2', label: '500 ml', quantity: 500, unit: 'ML', litres_per_unit: 0.500, is_active: true, sort_order: 2, created_at: '', updated_at: '' },
    ]
  },
  {
    id: 'p3', organization_id: '1', name: 'Full Cream Milk', short_name: 'FCM',
    description: null, is_active: true, sort_order: 3, created_at: '', updated_at: '',
    product_ranges: [
      { id: 'r5', product_id: 'p3', label: '250 ml', quantity: 250, unit: 'ML', litres_per_unit: 0.250, is_active: true, sort_order: 1, created_at: '', updated_at: '' },
      { id: 'r6', product_id: 'p3', label: '500 ml', quantity: 500, unit: 'ML', litres_per_unit: 0.500, is_active: true, sort_order: 2, created_at: '', updated_at: '' },
    ]
  },
  {
    id: 'p4', organization_id: '1', name: 'Curd', short_name: 'CURD',
    description: null, is_active: true, sort_order: 4, created_at: '', updated_at: '',
    product_ranges: [
      { id: 'r7', product_id: 'p4', label: '100 gm', quantity: 100, unit: 'GM', litres_per_unit: 0.100, is_active: true, sort_order: 1, created_at: '', updated_at: '' },
      { id: 'r8', product_id: 'p4', label: '500 gm', quantity: 500, unit: 'GM', litres_per_unit: 0.500, is_active: true, sort_order: 2, created_at: '', updated_at: '' },
    ]
  },
  {
    id: 'p5', organization_id: '1', name: 'Taak', short_name: 'TAAK',
    description: null, is_active: true, sort_order: 5, created_at: '', updated_at: '',
    product_ranges: [
      { id: 'r9', product_id: 'p5', label: '400 ml', quantity: 400, unit: 'ML', litres_per_unit: 0.400, is_active: true, sort_order: 1, created_at: '', updated_at: '' },
    ]
  },
];

export function useProducts(activeOnly = true) {
  const [products, setProducts] = useState<ProductWithRanges[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProductsWithRanges(activeOnly);
      setProducts(data.length > 0 ? data : MOCK_PRODUCTS);
    } catch (err: any) {
      console.warn('DB fetch failed, using mock products', err);
      setProducts(MOCK_PRODUCTS);
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
