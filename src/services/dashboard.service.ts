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

export type TableRow = {
  id: string;
  date: string;
  shopId: string;
  shop: string;
  product: string;
  range: string;
  units: number;
  litres: number;
};

// ── Live Supabase fetch ──
async function fetchLiveData(filters: DashboardFilters) {
  let query = supabase
    .from('daily_entry_items')
    .select(`
      id, count, litres,
      daily_entries!inner(entry_date, shop_id, shops(id, name)),
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

// ── Aggregate raw items → KPI + 3 charts + table ──
function aggregate(items: any[], filters: DashboardFilters) {
  const shopSet = new Set<string>();
  let totalLitres = 0, totalUnits = 0;

  const productMap: Record<string, { litres: number; units: number }> = {};
  const dailyMap: Record<string, { litres: number; units: number }> = {};
  const shopVolumeMap: Record<string, { name: string; litres: number }> = {};
  const tableRows: TableRow[] = [];

  items.forEach((item: any) => {
    const entry = item.daily_entries;
    const date = entry?.entry_date ?? '';
    const shopId = entry?.shop_id ?? '';
    const shopName = entry?.shops?.name ?? 'Unknown';
    const productName = item.products?.short_name ?? item.products?.name ?? 'Unknown';
    const rangeName = item.product_ranges?.label ?? '';
    const litres = Number(item.litres ?? 0);
    const count = Number(item.count ?? 0);

    totalLitres += litres;
    totalUnits  += count;
    shopSet.add(shopId);

    // Product-wise
    productMap[productName] ??= { litres: 0, units: 0 };
    productMap[productName].litres += litres;
    productMap[productName].units  += count;

    // Daily-wise
    dailyMap[date] ??= { litres: 0, units: 0 };
    dailyMap[date].litres += litres;
    dailyMap[date].units  += count;

    // Shop-wise
    shopVolumeMap[shopName] ??= { name: shopName, litres: 0 };
    shopVolumeMap[shopName].litres += litres;

    tableRows.push({
      id: item.id,
      date,
      shopId,
      shop: shopName,
      product: productName,
      range: rangeName,
      units: count,
      litres,
    });
  });

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

  // Top shops chart (sorted by litres descending)
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

// ── Mock data (used if DB fetch fails) ──
function mockData(filters: DashboardFilters) {
  const start = parseISO(filters.fromDate);
  const end = parseISO(filters.toDate);
  const durationDays = Math.max(1, differenceInCalendarDays(end, start) + 1);
  const totalLitres = 842.5;

  const kpi: KPIData = {
    totalLitres,
    totalUnits: 3421,
    totalShops: 29,
    avgSellPerDay: parseFloat((totalLitres / durationDays).toFixed(2)),
    durationDays,
  };

  const productChart: ChartData[] = [
    { name: 'FCM',  litres: 340, units: 680  },
    { name: 'SM',   litres: 240, units: 480  },
    { name: 'TM',   litres: 180, units: 720  },
    { name: 'CURD', litres: 62.5, units: 125 },
    { name: 'TAAK', litres: 20,   units: 50  },
  ];

  const allDays = eachDayOfInterval({ start, end });
  const dailyChart: ChartData[] = allDays.map((d, i) => ({
    name: format(d, 'dd MMM'),
    litres: 250 + Math.round(Math.sin(i) * 40),
    units: 1000 + Math.round(Math.sin(i) * 150),
  }));

  const topShopsChart: ChartData[] = [
    { name: 'Gopi Kishan Traders', litres: 185.0, units: 0 },
    { name: 'Umar Farooq Kirana',  litres: 85.0,  units: 0 },
    { name: 'Siddheshwar Gruh',   litres: 48.0,  units: 0 },
    { name: 'Pulgam Kirana',      litres: 24.0,  units: 0 },
    { name: 'Mudgonda Kirana',    litres: 22.0,  units: 0 },
  ];

  const tableData: TableRow[] = [
    { id: '1', date: filters.toDate, shopId: 's1', shop: 'Gopi Kishan Traders', product: 'FCM', range: '500 ml', units: 48, litres: 24.0 },
    { id: '2', date: filters.toDate, shopId: 's1', shop: 'Gopi Kishan Traders', product: 'TM',  range: '250 ml', units: 48, litres: 12.0 },
    { id: '3', date: filters.toDate, shopId: 's2', shop: 'Masan Kirana',         product: 'FCM', range: '500 ml', units: 6,  litres: 3.0  },
    { id: '4', date: filters.toDate, shopId: 's3', shop: 'Adam Kirana',           product: 'CURD', range: '500 gm', units: 2, litres: 1.0  },
  ];

  return { kpi, productChart, dailyChart, topShopsChart, tableData };
}

export const getDashboardData = async (filters: DashboardFilters) => {
  try {
    const items = await fetchLiveData(filters);
    if (items.length === 0) return mockData(filters);
    return aggregate(items, filters);
  } catch (err) {
    console.warn('Dashboard: falling back to mock data', err);
    return mockData(filters);
  }
};
