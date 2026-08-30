import { supabase } from '../lib/supabase';
import type { DailyEntry, DailyEntryItem } from '../types/database.types';

export type DailyEntryPayload = {
  organization_id: string;
  shop_id: string;
  entry_date: string;
  total_litres: number;
  total_units: number;
  items: Array<{
    product_id: string;
    product_range_id: string;
    count: number;
    unit_quantity: number | null;
    unit: string | null;
    litres_per_unit_snapshot: number | null;
    litres: number | null;
  }>;
};

export const getEntryForDateAndShop = async (
  date: string,
  shopId: string
): Promise<DailyEntry | null> => {
  const { data, error } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('entry_date', date)
    .eq('shop_id', shopId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching entry:', error);
    throw error;
  }

  return data;
};

export const getEntryItems = async (entryId: string): Promise<DailyEntryItem[]> => {
  const { data, error } = await supabase
    .from('daily_entry_items')
    .select('*')
    .eq('daily_entry_id', entryId);
    
  if (error) {
    console.error('Error fetching entry items:', error);
    throw error;
  }
  
  return data || [];
};

export const submitDailyEntry = async (payload: DailyEntryPayload): Promise<void> => {
  // Check if entry exists
  const existingEntry = await getEntryForDateAndShop(payload.entry_date, payload.shop_id);
  
  let entryId = existingEntry?.id;

  // Since Supabase RPC transaction is best, we'll do sequential operations here for simplicity in V1
  // In a robust setup, use a Postgres function (RPC) to handle this transactionally.
  
  if (existingEntry) {
    // Update existing
    const { error: updateError } = await supabase
      .from('daily_entries')
      .update({
        total_litres: payload.total_litres,
        total_units: payload.total_units,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingEntry.id);
      
    if (updateError) throw updateError;
    
    // Delete old items
    const { error: deleteError } = await supabase
      .from('daily_entry_items')
      .delete()
      .eq('daily_entry_id', existingEntry.id);
      
    if (deleteError) throw deleteError;
  } else {
    // Create new
    const { data: newEntry, error: insertError } = await supabase
      .from('daily_entries')
      .insert({
        organization_id: payload.organization_id,
        shop_id: payload.shop_id,
        entry_date: payload.entry_date,
        total_litres: payload.total_litres,
        total_units: payload.total_units
      })
      .select()
      .single();
      
    if (insertError) throw insertError;
    entryId = newEntry.id;
  }

  // Insert items
  if (payload.items.length > 0 && entryId) {
    const itemsToInsert = payload.items.map(item => ({
      ...item,
      daily_entry_id: entryId
    }));
    
    const { error: itemsError } = await supabase
      .from('daily_entry_items')
      .insert(itemsToInsert);
      
    if (itemsError) throw itemsError;
  }
};
