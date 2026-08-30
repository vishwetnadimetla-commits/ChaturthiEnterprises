import { supabase } from '../lib/supabase';
import type { Shop } from '../types/database.types';

export const getShops = async (activeOnly = false): Promise<Shop[]> => {
  let query = supabase
    .from('shops')
    .select('*')
    .order('sort_order', { ascending: true });

  if (activeOnly) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getShopsByRoute = async (routeManagerId: string, activeOnly = true): Promise<Shop[]> => {
  let query = supabase
    .from('shops')
    .select('*')
    .eq('route_manager_id', routeManagerId)
    .order('sort_order', { ascending: true });

  if (activeOnly) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const upsertShop = async (shop: Partial<Shop>): Promise<Shop> => {
  const { data, error } = await supabase
    .from('shops')
    .upsert(shop)
    .select()
    .single();
  if (error) throw error;
  return data;
};
