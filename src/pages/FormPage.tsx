import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, Store, MapPin, CheckCircle2, ChevronDown, Loader2 } from 'lucide-react';
import { useRouteManagers } from '../hooks/useRouteManagers';
import { useShops } from '../hooks/useShops';
import { useProducts } from '../hooks/useProducts';
import { calculateLitres, formatLitres } from '../utils/conversion';
import { submitDailyEntry, getEntryForDateAndShop, getEntryItems } from '../services/entries.service';
import type { DailyEntryPayload } from '../services/entries.service';

const ORG_ID = '11111111-0000-0000-0000-000000000001';

type FormCounts = Record<string, string>; // rangeId → count string

const KEY_LAST_ROUTE = 'ce_last_route';
const KEY_LAST_SHOP  = 'ce_last_shop';

export default function FormPage() {
  const [searchParams] = useSearchParams();
  const urlDate = searchParams.get('date');
  const urlShopId = searchParams.get('shopId');

  const { routeManagers, loading: routeLoading } = useRouteManagers();
  const { products, loading: productsLoading } = useProducts();
  const { shops: allShops } = useShops(false); // All shops to lookup routeId for urlShopId

  const [date, setDate] = useState(() => urlDate || format(new Date(), 'yyyy-MM-dd'));
  const [routeId, setRouteId] = useState(() => localStorage.getItem(KEY_LAST_ROUTE) || '');
  const [shopId, setShopId] = useState(() => urlShopId || localStorage.getItem(KEY_LAST_SHOP) || '');
  const [counts, setCounts] = useState<FormCounts>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // If opened via URL params (e.g. from Dashboard "Edit Entry"), match shop & route
  useEffect(() => {
    if (urlDate) setDate(urlDate);
    if (urlShopId && allShops.length > 0) {
      setShopId(urlShopId);
      const targetShop = allShops.find(s => s.id === urlShopId);
      if (targetShop?.route_manager_id) {
        setRouteId(targetShop.route_manager_id);
      }
    }
  }, [urlDate, urlShopId, allShops]);

  const { shops, loading: shopsLoading } = useShops(true, routeId || undefined);

  // Persist route + shop selection
  useEffect(() => { if (routeId) localStorage.setItem(KEY_LAST_ROUTE, routeId); }, [routeId]);
  useEffect(() => { if (shopId)  localStorage.setItem(KEY_LAST_SHOP,  shopId);  }, [shopId]);

  // When route changes, reset shop if it doesn't belong to new route
  const handleRouteChange = (newRouteId: string) => {
    setRouteId(newRouteId);
    setShopId('');
    setCounts({});
  };

  // Load existing entry when date + shop changes
  const loadExisting = useCallback(async () => {
    if (!date || !shopId) { setCounts({}); setIsEditing(false); return; }
    try {
      setLoadingExisting(true);
      const entry = await getEntryForDateAndShop(date, shopId);
      if (entry) {
        const items = await getEntryItems(entry.id);
        const loaded: FormCounts = {};
        items.forEach(item => {
          loaded[item.product_range_id] = item.count.toString();
        });
        setCounts(loaded);
        setIsEditing(true);
      } else {
        setCounts({});
        setIsEditing(false);
      }
    } catch {
      setCounts({});
      setIsEditing(false);
    } finally {
      setLoadingExisting(false);
    }
  }, [date, shopId]);

  useEffect(() => { loadExisting(); }, [loadExisting]);

  const handleCount = (rangeId: string, val: string) => {
    if (val !== '' && (isNaN(Number(val)) || Number(val) < 0)) return;
    setCounts(prev => ({ ...prev, [rangeId]: val }));
  };

  // Totals
  const { totalLitres, totalUnits } = useMemo(() => {
    let litres = 0, units = 0;
    products.forEach(p =>
      p.product_ranges.forEach(r => {
        const n = Number(counts[r.id] || 0);
        units += n;
        litres += calculateLitres(n, r.litres_per_unit);
      })
    );
    return { totalLitres: litres, totalUnits: units };
  }, [counts, products]);

  const handleSubmit = async () => {
    if (!date)   return alert('Please select a date.');
    if (!routeId) return alert('Please select a Route Manager.');
    if (!shopId) return alert('Please select a shop.');

    try {
      setSubmitting(true);
      const items: DailyEntryPayload['items'] = [];
      products.forEach(p =>
        p.product_ranges.forEach(r => {
          const n = Number(counts[r.id] || 0);
          items.push({
            product_id: p.id,
            product_range_id: r.id,
            count: n,
            unit_quantity: r.quantity,
            unit: r.unit,
            litres_per_unit_snapshot: r.litres_per_unit,
            litres: calculateLitres(n, r.litres_per_unit),
          });
        })
      );

      await submitDailyEntry({
        organization_id: ORG_ID,
        shop_id: shopId,
        entry_date: date,
        total_litres: totalLitres,
        total_units: totalUnits,
        items,
      });

      setSubmitted(true);
    } catch (err: any) {
      alert('Failed to submit: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnother = () => {
    setSubmitted(false);
    setCounts({});
    setShopId('');
    setIsEditing(false);
  };

  // ── SUCCESS SCREEN ──
  if (submitted) {
    const selectedShop = allShops.find(s => s.id === shopId) || shops.find(s => s.id === shopId);
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[70vh] text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isEditing ? 'Entry Updated!' : 'Entry Saved!'}
          </h2>
          <p className="text-slate-500 mt-1">
            {selectedShop?.name} — {format(new Date(date), 'dd MMM yyyy')}
          </p>
          <p className="text-slate-400 text-sm mt-0.5">
            {totalLitres.toFixed(2)} L · {totalUnits} units
          </p>
        </div>
        <button onClick={handleAnother} className="btn-primary px-8 py-3 text-base">
          + Submit Another Entry
        </button>
      </div>
    );
  }

  const isLoading = routeLoading || productsLoading;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">

      {/* ── Header Fields (sticky on mobile) ── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 md:static z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">

          {/* Date */}
          <div>
            <label className="label-xs flex items-center gap-1 mb-1.5">
              <Calendar size={11} /> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="input-base text-sm font-medium"
            />
          </div>

          {/* Route Manager */}
          <div>
            <label className="label-xs flex items-center gap-1 mb-1.5">
              <MapPin size={11} /> Route Manager <span className="text-red-400 ml-0.5">*</span>
            </label>
            <div className="relative">
              <select
                value={routeId}
                onChange={e => handleRouteChange(e.target.value)}
                className="input-base text-sm font-medium appearance-none pr-10"
                disabled={routeLoading}
              >
                <option value="">— Select Route Manager —</option>
                {routeManagers.map(rm => (
                  <option key={rm.id} value={rm.id}>{rm.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Shop — shown only after route is selected */}
          {routeId && (
            <div>
              <label className="label-xs flex items-center gap-1 mb-1.5">
                <Store size={11} /> Shop <span className="text-red-400 ml-0.5">*</span>
              </label>
              <div className="relative">
                <select
                  value={shopId}
                  onChange={e => setShopId(e.target.value)}
                  className="input-base text-sm font-medium appearance-none pr-10"
                  disabled={shopsLoading}
                >
                  <option value="">— Select Shop —</option>
                  {shops.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {isEditing && (
                <p className="mt-1.5 text-xs text-blue-600 font-bold bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  ✏️ Editing existing entry for this date & shop. Modify counts below and click UPDATE.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Product Entry ── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
            <Loader2 className="animate-spin" size={20} /> Loading products...
          </div>
        ) : loadingExisting ? (
          <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
            <Loader2 className="animate-spin" size={20} /> Checking existing entry...
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-36">
            {products.map(product => (
              <div key={product.id} className="card overflow-hidden">
                {/* Product header */}
                <div className="px-4 py-3 bg-brand-50 border-b border-brand-100 flex items-center gap-2">
                  <span className="text-xs font-bold text-white bg-brand-600 px-2 py-0.5 rounded-md">{product.short_name}</span>
                  <span className="text-sm font-semibold text-brand-800">{product.name}</span>
                </div>

                {/* Range rows */}
                {product.product_ranges.map(range => {
                  const countVal = counts[range.id] ?? '';
                  const n = Number(countVal);
                  const litres = n > 0 ? calculateLitres(n, range.litres_per_unit) : null;

                  return (
                    <div key={range.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0">
                      {/* Label */}
                      <div className="w-20 shrink-0">
                        <span className="text-sm font-semibold text-slate-700">{range.label}</span>
                      </div>

                      {/* Count input */}
                      <div className="flex-1">
                        <input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          min="0"
                          placeholder="0"
                          value={countVal}
                          onChange={e => handleCount(range.id, e.target.value)}
                          className="w-full text-center text-lg font-bold py-2 px-3 border-2 border-slate-200
                                     rounded-xl focus:border-brand-500 focus:outline-none transition-colors
                                     bg-white"
                        />
                      </div>

                      {/* Litres */}
                      <div className="w-20 shrink-0 text-right">
                        {litres !== null ? (
                          <span className="text-sm font-semibold text-brand-700">{formatLitres(litres)}</span>
                        ) : (
                          <span className="text-sm text-slate-300">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sticky Bottom Bar ── */}
      <div className="fixed bottom-[56px] md:bottom-0 left-0 right-0 md:left-64 bg-white border-t border-slate-200
                      shadow-[0_-4px_12px_rgba(0,0,0,0.06)] z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="label-xs mb-0.5 flex items-center gap-1">
              Total
              {isEditing && <span className="bg-blue-100 text-blue-600 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ml-1">Editing</span>}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-900">{formatLitres(totalLitres)}</span>
              <span className="text-xs text-slate-400 font-medium">{totalUnits} units</span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !shopId || !routeId || loadingExisting}
            className={`btn-primary flex-1 max-w-[180px] py-3 text-base flex items-center justify-center gap-2
              ${isEditing ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          >
            {submitting
              ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
              : isEditing ? 'UPDATE ENTRY' : 'SUBMIT'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
