import { supabase } from '../lib/supabase';
import { format, eachDayOfInterval, parseISO, differenceInCalendarDays } from 'date-fns';

export type DashboardFilters = {
  fromDate: string;
  toDate: string;
  shopId: string;
  productId: string;
};

export type KPIData = {
  totalLitres: number;
  totalUnits: number;
  totalShops: number;
  avgSellPerDay: number;
  durationDays: number;
};

export type ChartData = {
  name: string;
  litres: number;
  units: number;
};

export type DailyEntryItemSummary = {
  id: string;
  product: string;
  shortName: string;
  range: string;
  units: number;
  litres: number;
};

export type TableRow = {
  id: string;
  date: string;
  shopId: string;
  shop: string;
  totalUnits: number;
  totalLitres: number;
  summaryBadges: { name: string; litres: number }[];
  items: DailyEntryItemSummary[];
};

// ── Live Supabase fetch ──
async function fetchLiveData(filters: DashboardFilters) {
  let query = supabase
    .from('daily_entry_items')
    .select(`
      id, count, litres,
      daily_entries!inner(id, entry_date, shop_id, shops(id, name)),
      products(name, short_name),
      product_ranges(label)
    `)
    .gte('daily_entries.entry_date', filters.fromDate)
    .lte('daily_entries.entry_date', filters.toDate);

  if (filters.shopId)    query = query.eq('daily_entries.shop_id', filters.shopId);
  if (filters.productId) query = query.eq('product_id', filters.productId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ── Aggregate raw items → KPI + 3 charts + single-line grouped shop entry table ──
function aggregate(items: any[], filters: DashboardFilters) {
  const shopSet = new Set<string>();
  let totalLitres = 0, totalUnits = 0;

  const productMap: Record<string, { litres: number; units: number }> = {};
  const dailyMap: Record<string, { litres: number; units: number }> = {};
  const shopVolumeMap: Record<string, { name: string; litres: number }> = {};
  
  // Group items by daily_entry_id (Date + Shop)
  const entryGroupMap: Record<string, TableRow> = {};

  items.forEach((item: any) => {
    const entry = item.daily_entries;
    const entryId = entry?.id ?? `${entry?.entry_date}_${entry?.shop_id}`;
    const date = entry?.entry_date ?? '';
    const shopId = entry?.shop_id ?? '';
    const shopName = entry?.shops?.name ?? 'Unknown';
    const productName = item.products?.name ?? 'Unknown';
    const productShortName = item.products?.short_name ?? productName;
    const rangeName = item.product_ranges?.label ?? '';
    const litres = Number(item.litres ?? 0);
    const count = Number(item.count ?? 0);

    totalLitres += litres;
    totalUnits  += count;
    shopSet.add(shopId);

    // Product-wise
    productMap[productShortName] ??= { litres: 0, units: 0 };
    productMap[productShortName].litres += litres;
    productMap[productShortName].units  += count;

    // Daily-wise
    dailyMap[date] ??= { litres: 0, units: 0 };
    dailyMap[date].litres += litres;
    dailyMap[date].units  += count;

    // Shop-wise
    shopVolumeMap[shopName] ??= { name: shopName, litres: 0 };
    shopVolumeMap[shopName].litres += litres;

    // Single-line Grouping for Table
    if (!entryGroupMap[entryId]) {
      entryGroupMap[entryId] = {
        id: entryId,
        date,
        shopId,
        shop: shopName,
        totalUnits: 0,
        totalLitres: 0,
        summaryBadges: [],
        items: [],
      };
    }

    const row = entryGroupMap[entryId];
    row.totalUnits += count;
    row.totalLitres += litres;

    // Summary badge grouping by product short name
    let badge = row.summaryBadges.find(b => b.name === productShortName);
    if (!badge) {
      badge = { name: productShortName, litres: 0 };
      row.summaryBadges.push(badge);
    }
    badge.litres += litres;

    row.items.push({
      id: item.id,
      product: productName,
      shortName: productShortName,
      range: rangeName,
      units: count,
      litres,
    });
  });

  // Convert grouped object to array & sort by date descending
  const tableRows: TableRow[] = Object.values(entryGroupMap).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const productChart: ChartData[] = Object.entries(productMap).map(([name, v]) => ({
    name,
    litres: parseFloat(v.litres.toFixed(2)),
    units: v.units,
  }));

  // Fill missing days in range with 0
  const start = parseISO(filters.fromDate);
  const end = parseISO(filters.toDate);
  const allDays = eachDayOfInterval({ start, end });
  const dailyChart: ChartData[] = allDays.map(d => {
    const key = format(d, 'yyyy-MM-dd');
    const v = dailyMap[key] ?? { litres: 0, units: 0 };
    return { name: format(d, 'dd MMM'), litres: parseFloat(v.litres.toFixed(2)), units: v.units };
  });

  // Top shops chart
  const topShopsChart: ChartData[] = Object.values(shopVolumeMap)
    .sort((a, b) => b.litres - a.litres)
    .slice(0, 10)
    .map(s => ({
      name: s.name.length > 18 ? s.name.slice(0, 18) + '…' : s.name,
      litres: parseFloat(s.litres.toFixed(2)),
      units: 0,
    }));

  const durationDays = Math.max(1, differenceInCalendarDays(end, start) + 1);
  const avgSellPerDay = parseFloat((totalLitres / durationDays).toFixed(2));

  return {
    kpi: {
      totalLitres: parseFloat(totalLitres.toFixed(2)),
      totalUnits,
      totalShops: shopSet.size,
      avgSellPerDay,
      durationDays,
    },
    productChart,
    dailyChart,
    topShopsChart,
    tableData: tableRows,
  };
}

export const getDashboardData = async (filters: DashboardFilters) => {
  try {
    const items = await fetchLiveData(filters);
    return aggregate(items, filters);
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    return aggregate([], filters);
  }
};
