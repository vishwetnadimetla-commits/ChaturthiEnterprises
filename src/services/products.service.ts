import { supabase } from '../lib/supabase';
import type { Product, ProductWithRanges, ProductRange } from '../types/database.types';

export const getProducts = async (activeOnly = false): Promise<Product[]> => {
  let query = supabase.from('products').select('*').order('sort_order', { ascending: true });
  
  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
  
  return data || [];
};

export const upsertProduct = async (product: Partial<Product>): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .upsert(product)
    .select()
    .single();
    
  if (error) {
    console.error('Error upserting product:', error);
    throw error;
  }
  
  return data;
};

export const getProductsWithRanges = async (activeOnly = false): Promise<ProductWithRanges[]> => {
  let query = supabase
    .from('products')
    .select(`
      *,
      product_ranges (*)
    `)
    .order('sort_order', { ascending: true });
    
  if (activeOnly) {
    query = query.eq('is_active', true).eq('product_ranges.is_active', true);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching products with ranges:', error);
    throw error;
  }
  
  // Need to sort the ranges manually since nested ordering is trickier
  return (data || []).map(p => ({
    ...p,
    product_ranges: (p.product_ranges || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
  })) as ProductWithRanges[];
};

export const upsertRange = async (range: Partial<ProductRange>): Promise<ProductRange> => {
  const { data, error } = await supabase
    .from('product_ranges')
    .upsert(range)
    .select()
    .single();
    
  if (error) {
    console.error('Error upserting product range:', error);
    throw error;
  }
  
  return data;
};
