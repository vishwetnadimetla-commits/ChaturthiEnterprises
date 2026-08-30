# Chaturthi Enterprises — Database Structure & API Spec

## Core Principles
1. **Never hardcode configurations** (shops, products, ranges) into React UI. Database is the source of truth.
2. **Historical Data Protection:** Changing product range configuration (litres_per_unit) must NOT affect historical entries. The `daily_entry_items` table stores a snapshot of the conversion rate.
3. **No Duplicate Submissions:** Enforce one entry per Date + Shop combination (unique constraint in Supabase).
4. **Normalized Records:** Do not create wide tables for daily entries. Use one `daily_entries` record and multiple `daily_entry_items`.

---

## Supabase Tables & Schema

### `organizations`
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `shops`
```sql
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  code TEXT,
  address TEXT,
  phone TEXT,
  route_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `products`
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  short_name TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `product_ranges`
```sql
CREATE TABLE product_ranges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  label TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT,
  litres_per_unit NUMERIC,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `daily_entries`
```sql
CREATE TABLE daily_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  shop_id UUID REFERENCES shops(id),
  entry_date DATE NOT NULL,
  total_litres NUMERIC DEFAULT 0,
  total_units NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, entry_date) -- Prevent duplicate entries for the same shop on the same day
);
```

### `daily_entry_items`
```sql
CREATE TABLE daily_entry_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_entry_id UUID REFERENCES daily_entries(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_range_id UUID REFERENCES product_ranges(id),
  count NUMERIC DEFAULT 0,
  unit_quantity NUMERIC, -- Snapshot for historical safety
  unit TEXT, -- Snapshot for historical safety
  litres_per_unit_snapshot NUMERIC, -- Snapshot for historical safety
  litres NUMERIC, -- Snapshot of calculated value
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Security & Row Level Security (RLS)
- DO NOT use `SUPABASE_SERVICE_ROLE_KEY` in React. Use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Enable RLS on all tables.
- For V1 (without auth), you can set open read/write policies on these tables for authenticated/anon roles if needed, but ensure they are structured to accept an `auth.uid()` or an `organization_id` down the line.

---

## Frontend Service Layer (API Calls Structure)

### `services/shops.service.ts`
- `getShops(activeOnly: boolean)`: Fetch shops ordered by `sort_order`.
- `upsertShop(shop: Shop)`: Create or update a shop.

### `services/products.service.ts`
- `getProducts(activeOnly: boolean)`: Fetch products ordered by `sort_order`.
- `upsertProduct(product: Product)`: Create or update a product.

### `services/productRanges.service.ts`
- `getRanges(activeOnly: boolean)`: Fetch ranges joined with products.
- `upsertRange(range: ProductRange)`: Create or update a range.

### `services/entries.service.ts`
- `getEntryForDateAndShop(date: string, shopId: string)`: Check if an entry exists to prevent duplicates or enable editing.
- `submitDailyEntry(entryData: DailyEntryPayload)`: Insert into `daily_entries` and `daily_entry_items` (wrap in transaction/RPC if possible, or execute sequential inserts).

### `services/dashboard.service.ts`
- `getDashboardStats(filters: DashboardFilters)`: Fetch filtered totals (litres, units, shops, entries).
- `getChartData(filters: DashboardFilters)`: Fetch aggregated grouped data for Recharts.
- `getDetailedTableData(filters: DashboardFilters)`: Fetch paginated item-level data for the data grid.

### `utils/conversion.ts`
```typescript
export const calculateLitres = (count: number, litresPerUnit: number): number => {
  return count * litresPerUnit;
};

export const formatLitres = (value: number): string => {
  return value.toFixed(2) + " L";
};
```
