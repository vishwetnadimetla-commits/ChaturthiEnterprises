import { supabase } from '../lib/supabase';
import type { RouteManager } from '../types/database.types';

export const getRouteManagers = async (activeOnly = false): Promise<RouteManager[]> => {
  let query = supabase
    .from('route_managers')
    .select('*')
    .order('sort_order', { ascending: true });

  if (activeOnly) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const upsertRouteManager = async (rm: Partial<RouteManager>): Promise<RouteManager> => {
  const { data, error } = await supabase
    .from('route_managers')
    .upsert(rm)
    .select()
    .single();
  if (error) throw error;
  return data;
};
