import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://orcblzsggomigabcnnlo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4KwH2FiBVeuC2QdMR_YrTw_EzEajnnU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
