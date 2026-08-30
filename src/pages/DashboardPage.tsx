import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
} from 'recharts';
import {
  Download, SlidersHorizontal, RefreshCw, Loader2, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, Pencil, Eye, ZoomIn, ZoomOut, Search, X
} from 'lucide-react';
import { getDashboardData } from '../services/dashboard.service';
import type { DashboardFilters, KPIData, ChartData, TableRow } from '../services/dashboard.service';
import { useShops } from '../hooks/useShops';
import { useProducts } from '../hooks/useProducts';
import { exportToExcel, exportDashboardToPDF } from '../services/exports.service';

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-5 flex flex-col gap-1">
      <p className="label-xs">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900 leading-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 font-medium">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { shops } = useShops(false);
  const { products } = useProducts(false);

  const [filters, setFilters] = useState<DashboardFilters>({
    fromDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    toDate: format(new Date(), 'yyyy-MM-dd'),
    shopId: '',
    productId: '',
  });
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [productChart, setProductChart] = useState<ChartData[]>([]);
  const [dailyChart, setDailyChart] = useState<ChartData[]>([]);
  const [topShopsChart, setTopShopsChart] = useState<ChartData[]>([]);
  const [tableData, setTableData] = useState<TableRow[]>([]);

  // ── Chart Zoom States (Width Multipliers) ──
  const [zoom1, setZoom1] = useState<number>(100);
  const [zoom2, setZoom2] = useState<number>(100);
  const [zoom3, setZoom3] = useState<number>(100);

  // ── Full Screen Chart Overlay State ──
  const [fullScreenChart, setFullScreenChart] = useState<{
    title: string;
    type: 'product' | 'daily' | 'topShops';
  } | null>(null);

  // ── Table Pagination & Full Screen Table State ──
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [tableSearch, setTableSearch] = useState<string>('');
  const [fullTableOpen, setFullTableOpen] = useState<boolean>(false);

  const loadData = async (f = filters) => {
    setLoading(true);
    try {
      const d = await getDashboardData(f);
      setKpi(d.kpi);
      setProductChart(d.productChart);
      setDailyChart(d.dailyChart);
      setTopShopsChart(d.topShopsChart || []);
      setTableData(d.tableData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const reset = () => {
    const f: DashboardFilters = {
      fromDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
      toDate: format(new Date(), 'yyyy-MM-dd'),
      shopId: '',
      productId: '',
    };
    setFilters(f);
    loadData(f);
  };

  // Filtered Table Data for Search
  const filteredTableData = useMemo(() => {
    if (!tableSearch.trim()) return tableData;
    const q = tableSearch.toLowerCase();
    return tableData.filter(r =>
      r.shop.toLowerCase().includes(q) ||
      r.product.toLowerCase().includes(q) ||
      r.range.toLowerCase().includes(q) ||
      r.date.includes(q)
    );
  }, [tableData, tableSearch]);

  // Paginated Rows
  const totalPages = Math.ceil(filteredTableData.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    if (pageSize === -1) return filteredTableData; // All
    const start = (currentPage - 1) * pageSize;
    return filteredTableData.slice(start, start + pageSize);
  }, [filteredTableData, currentPage, pageSize]);

  const tooltipStyle = {
    borderRadius: '10px',
    border: 'none',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    fontSize: '12px',
  };

  // Helper to render chart content
  const renderChart = (type: 'product' | 'daily' | 'topShops', height = 280) => {
    if (type === 'product') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={productChart} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="litres" name="Litres (L)" fill="#7c3aed" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (type === 'daily') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={dailyChart} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorLitres" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="litres" name="Litres (L)" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorLitres)" />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
    // Top shops horizontal bar chart
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={topShopsChart} layout="vertical" margin={{ top: 10, right: 15, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={130} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="litres" name="Total Litres (L)" fill="#9a6bff" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">

      {/* ── Page Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="section-header">Dashboard</h2>
          <p className="text-sm text-slate-400 mt-0.5">Distribution analytics, reports & record updates</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { if (kpi) exportToExcel(filters, kpi, tableData); }}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Download size={15} /> Excel Export
          </button>
          <button
            onClick={() => exportDashboardToPDF('dash-export')}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Download size={15} /> PDF Report
          </button>
        </div>
      </div>

      <div id="dash-export" className="flex-1 p-4 md:p-6 space-y-6 bg-slate-50">

        {/* ── Filters ── */}
        <div className="card p-4">
          <p className="label-xs flex items-center gap-1.5 mb-3">
            <SlidersHorizontal size={11} /> Filters
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="label-xs mb-1 block">From Date</label>
              <input type="date" value={filters.fromDate}
                onChange={e => setFilters({ ...filters, fromDate: e.target.value })}
                className="input-base text-sm" />
            </div>
            <div>
              <label className="label-xs mb-1 block">To Date</label>
              <input type="date" value={filters.toDate}
                onChange={e => setFilters({ ...filters, toDate: e.target.value })}
                className="input-base text-sm" />
            </div>
            <div>
              <label className="label-xs mb-1 block">Filter Shop</label>
              <select value={filters.shopId}
                onChange={e => setFilters({ ...filters, shopId: e.target.value })}
                className="input-base text-sm appearance-none">
                <option value="">All Shops</option>
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-xs mb-1 block">Filter Product</label>
              <select value={filters.productId}
                onChange={e => setFilters({ ...filters, productId: e.target.value })}
                className="input-base text-sm appearance-none">
                <option value="">All Products</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.short_name} — {p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
            <button onClick={reset} className="btn-secondary text-sm py-2 flex items-center gap-1.5">
              <RefreshCw size={13} /> Reset
            </button>
            <button onClick={() => loadData()} className="btn-primary text-sm py-2 px-5">
              Apply Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
            <Loader2 size={20} className="animate-spin" /> Loading analytics...
          </div>
        ) : (
          <>
            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Total Litres" value={`${kpi?.totalLitres.toFixed(2)} L`} sub="total volume distributed" />
              <KpiCard label="Total Units" value={kpi?.totalUnits.toLocaleString() ?? '0'} sub="total packs distributed" />
              <KpiCard label="Active Shops" value={String(kpi?.totalShops ?? 0)} sub="shops with entries" />
              <KpiCard
                label="Avg. Sell / Day"
                value={`${kpi?.avgSellPerDay.toFixed(2) ?? '0.00'} L`}
                sub={`over ${kpi?.durationDays ?? 1} selected day(s)`}
              />
            </div>

            {/* ── 3 CHARTS STACKED IN COLUMNS (Vertical Layout) ── */}
            <div className="flex flex-col gap-6">

              {/* Chart 1: Product-wise Litres */}
              <div className="card p-5 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">1. Product-wise Litres Distribution</h3>
                    <p className="text-xs text-slate-400">Total volume by product type</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Zoom / Width controls */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
                      <span className="text-slate-400 px-1">Width:</span>
                      {[100, 150, 200].map(z => (
                        <button
                          key={z}
                          onClick={() => setZoom1(z)}
                          className={`px-2 py-0.5 rounded ${zoom1 === z ? 'bg-white font-bold text-brand-700 shadow-xs' : 'text-slate-600'}`}
                        >
                          {z}%
                        </button>
                      ))}
                    </div>
                    {/* Full Screen View button */}
                    <button
                      onClick={() => setFullScreenChart({ title: 'Product-wise Litres Distribution', type: 'product' })}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <Maximize2 size={13} /> Full Screen
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div style={{ width: `${zoom1}%` }} className="transition-all duration-200">
                    {renderChart('product', 280)}
                  </div>
                </div>
              </div>

              {/* Chart 2: Daily Litres Trend */}
              <div className="card p-5 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">2. Daily Volume Trend</h3>
                    <p className="text-xs text-slate-400">Day-by-day distribution litres timeline</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
                      <span className="text-slate-400 px-1">Width:</span>
                      {[100, 150, 200].map(z => (
                        <button
                          key={z}
                          onClick={() => setZoom2(z)}
                          className={`px-2 py-0.5 rounded ${zoom2 === z ? 'bg-white font-bold text-brand-700 shadow-xs' : 'text-slate-600'}`}
                        >
                          {z}%
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setFullScreenChart({ title: 'Daily Volume Trend', type: 'daily' })}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <Maximize2 size={13} /> Full Screen
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div style={{ width: `${zoom2}%` }} className="transition-all duration-200">
                    {renderChart('daily', 280)}
                  </div>
                </div>
              </div>

              {/* Chart 3: Top Shops Volume Ranking */}
              <div className="card p-5 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">3. Top Shops by Sales Volume</h3>
                    <p className="text-xs text-slate-400">Highest volume performing shops in selected period</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
                      <span className="text-slate-400 px-1">Width:</span>
                      {[100, 150, 200].map(z => (
                        <button
                          key={z}
                          onClick={() => setZoom3(z)}
                          className={`px-2 py-0.5 rounded ${zoom3 === z ? 'bg-white font-bold text-brand-700 shadow-xs' : 'text-slate-600'}`}
                        >
                          {z}%
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setFullScreenChart({ title: 'Top Shops by Sales Volume', type: 'topShops' })}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <Maximize2 size={13} /> Full Screen
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div style={{ width: `${zoom3}%` }} className="transition-all duration-200">
                    {renderChart('topShops', 320)}
                  </div>
                </div>
              </div>

            </div>

            {/* ── DETAILED DISTRIBUTION TABLE (WITH TOP RIGHT PAGINATION & VIEW ALL) ── */}
            <div className="card overflow-hidden">
              {/* Header with Top-aligned Right Pagination & View All Button */}
              <div className="px-5 py-4 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Detailed Distribution Records</h3>
                  <p className="text-xs text-slate-400">Total {filteredTableData.length} records found. Click Edit to update entry anytime.</p>
                </div>

                {/* Right-aligned Top Pagination & Action Controls */}
                <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
                  {/* Search box */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search shop/product..."
                      value={tableSearch}
                      onChange={e => { setTableSearch(e.target.value); setCurrentPage(1); }}
                      className="text-xs border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 w-44 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>

                  {/* Page Size Selector */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Rows:</span>
                    <select
                      value={pageSize}
                      onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                      className="bg-slate-100 border border-slate-200 rounded-md px-2 py-1 font-semibold focus:outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={-1}>All</option>
                    </select>
                  </div>

                  {/* Pagination Buttons */}
                  {pageSize !== -1 && (
                    <div className="flex items-center gap-1 text-xs">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="btn-secondary py-1 px-2 text-xs disabled:opacity-30"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="px-2 font-semibold text-slate-600">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="btn-secondary py-1 px-2 text-xs disabled:opacity-30"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}

                  {/* View All / Full Page View Button */}
                  <button
                    onClick={() => setFullTableOpen(true)}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0"
                  >
                    <Eye size={13} /> View All (Full Screen)
                  </button>
                </div>
              </div>

              {/* Table Data */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {['Date', 'Shop Name', 'Product', 'Pack Size', 'Units', 'Litres', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider last:text-right">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">
                          No matching distribution records found.
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map(row => (
                        <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3 text-slate-500 text-xs font-medium">
                            {format(new Date(row.date), 'dd MMM yyyy')}
                          </td>
                          <td className="px-5 py-3 font-semibold text-slate-800">{row.shop}</td>
                          <td className="px-5 py-3">
                            <span className="text-xs font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-md">{row.product}</span>
                          </td>
                          <td className="px-5 py-3 text-slate-500 text-xs">{row.range}</td>
                          <td className="px-5 py-3 font-medium text-slate-700">{row.units}</td>
                          <td className="px-5 py-3 font-bold text-slate-900">{row.litres.toFixed(2)} L</td>
                          <td className="px-5 py-3 text-right">
                            {/* UPDATE ENTRY BUTTON */}
                            <button
                              onClick={() => navigate(`/?date=${row.date}&shopId=${row.shopId}`)}
                              className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 ml-auto text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                              title="Update/Edit entry for this shop and date"
                            >
                              <Pencil size={11} /> Edit Entry
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── FULL SCREEN CHART OVERLAY MODAL ── */}
      {fullScreenChart && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col p-4 md:p-8">
          <div className="bg-white rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{fullScreenChart.title}</h3>
                <p className="text-xs text-slate-400">Expanded full page chart view</p>
              </div>
              <button
                onClick={() => setFullScreenChart(null)}
                className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 p-6 flex items-center justify-center">
              {renderChart(fullScreenChart.type, 500)}
            </div>
          </div>
        </div>
      )}

      {/* ── FULL SCREEN TABLE OVERLAY MODAL ── */}
      {fullTableOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col p-4 md:p-8">
          <div className="bg-white rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Full Screen Distribution Records</h3>
                <p className="text-xs text-slate-400">Total {filteredTableData.length} records</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search in full table..."
                    value={tableSearch}
                    onChange={e => setTableSearch(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 w-60 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                <button
                  onClick={() => setFullTableOpen(false)}
                  className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 z-10">
                  <tr>
                    {['#', 'Date', 'Shop Name', 'Product', 'Pack Size', 'Units', 'Litres', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider last:text-right">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTableData.map((row, idx) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 text-slate-400 text-xs">{idx + 1}</td>
                      <td className="px-5 py-3 text-slate-600 text-xs font-medium">
                        {format(new Date(row.date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{row.shop}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-md">{row.product}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{row.range}</td>
                      <td className="px-5 py-3 font-medium text-slate-700">{row.units}</td>
                      <td className="px-5 py-3 font-bold text-slate-900">{row.litres.toFixed(2)} L</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => {
                            setFullTableOpen(false);
                            navigate(`/?date=${row.date}&shopId=${row.shopId}`);
                          }}
                          className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 ml-auto text-blue-600 hover:text-blue-700"
                        >
                          <Pencil size={11} /> Edit Entry
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
