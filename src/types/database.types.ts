export type Organization = {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RouteManager = {
  id: string;
  organization_id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Shop = {
  id: string;
  organization_id: string;
  route_manager_id: string | null;
  name: string;
  code: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  organization_id: string;
  name: string;
  short_name: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProductRange = {
  id: string;
  product_id: string;
  label: string;
  quantity: number | null;
  unit: string | null;
  litres_per_unit: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type DailyEntry = {
  id: string;
  organization_id: string;
  shop_id: string;
  entry_date: string;
  total_litres: number;
  total_units: number;
  created_at: string;
  updated_at: string;
};

export type DailyEntryItem = {
  id: string;
  daily_entry_id: string;
  product_id: string;
  product_range_id: string;
  count: number;
  unit_quantity: number | null;
  unit: string | null;
  litres_per_unit_snapshot: number | null;
  litres: number | null;
  created_at: string;
};

// Joined types for UI
export type ProductWithRanges = Product & {
  product_ranges: ProductRange[];
};

export type ShopWithRoute = Shop & {
  route_managers?: RouteManager | null;
};
