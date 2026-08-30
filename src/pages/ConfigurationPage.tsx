import { useState } from 'react';
import { Store, Package, MapPin, Plus, ToggleLeft, ToggleRight, Pencil, X, Save } from 'lucide-react';
import { useShops } from '../hooks/useShops';
import { useProducts } from '../hooks/useProducts';
import { useRouteManagers } from '../hooks/useRouteManagers';
import { upsertRouteManager } from '../services/routeManagers.service';
import { upsertShop } from '../services/shops.service';
import { upsertProduct, upsertRange } from '../services/products.service';
import type { RouteManager, Shop, ProductWithRanges, ProductRange } from '../types/database.types';

const ORG_ID = '11111111-0000-0000-0000-000000000001';

type Tab = 'routes' | 'shops' | 'products';

export default function ConfigurationPage() {
  const [activeTab, setActiveTab] = useState<Tab>('shops');
  const { shops, refetch: refetchShops } = useShops(false);
  const { products, refetch: refetchProducts } = useProducts(false);
  const { routeManagers, refetch: refetchRoutes } = useRouteManagers(false);

  // Sub-tab state for filtering shops by Route Manager
  const [shopRouteSubTab, setShopRouteSubTab] = useState<string>('all');

  // ── Modal States ──
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Partial<RouteManager> | null>(null);

  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Partial<Shop> | null>(null);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<ProductWithRanges> | null>(null);

  const [rangeModalOpen, setRangeModalOpen] = useState(false);
  const [editingRange, setEditingRange] = useState<Partial<ProductRange> & { productId?: string } | null>(null);

  const [saving, setSaving] = useState(false);

  // ── ROUTE HANDLERS ──
  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute?.name?.trim()) return alert('Route name is required.');
    try {
      setSaving(true);
      await upsertRouteManager({
        id: editingRoute.id,
        organization_id: ORG_ID,
        name: editingRoute.name.trim(),
        phone: editingRoute.phone || null,
        is_active: editingRoute.is_active ?? true,
        sort_order: editingRoute.sort_order ?? routeManagers.length + 1,
      });
      await refetchRoutes();
      setRouteModalOpen(false);
      setEditingRoute(null);
    } catch (err: any) {
      alert('Error saving route: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleRouteStatus = async (rm: RouteManager) => {
    try {
      await upsertRouteManager({ ...rm, is_active: !rm.is_active });
      await refetchRoutes();
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  // ── SHOP HANDLERS ──
  const handleAddShopClick = () => {
    const defaultRoute = shopRouteSubTab !== 'all' ? shopRouteSubTab : '';
    setEditingShop({
      is_active: true,
      route_manager_id: defaultRoute,
    });
    setShopModalOpen(true);
  };

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop?.name?.trim()) return alert('Shop name is required.');
    if (!editingShop?.route_manager_id) return alert('Selection of Route Manager is compulsory when adding/editing a shop.');

    try {
      setSaving(true);
      await upsertShop({
        id: editingShop.id,
        organization_id: ORG_ID,
        route_manager_id: editingShop.route_manager_id,
        name: editingShop.name.trim(),
        code: editingShop.code?.trim() || null,
        phone: editingShop.phone || null,
        is_active: editingShop.is_active ?? true,
        sort_order: editingShop.sort_order ?? shops.length + 1,
      });
      await refetchShops();
      setShopModalOpen(false);
      setEditingShop(null);
    } catch (err: any) {
      alert('Error saving shop: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleShopStatus = async (shop: Shop) => {
    try {
      await upsertShop({ ...shop, is_active: !shop.is_active });
      await refetchShops();
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleAssignRoute = async (shop: Shop, routeId: string) => {
    try {
      await upsertShop({ ...shop, route_manager_id: routeId });
      await refetchShops();
    } catch (err: any) {
      alert('Error assigning route: ' + err.message);
    }
  };

  // Filtered shops based on selected route sub-tab
  const filteredShops = shopRouteSubTab === 'all'
    ? shops
    : shops.filter(s => s.route_manager_id === shopRouteSubTab);

  // ── PRODUCT HANDLERS ──
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name?.trim()) return alert('Product name is required.');
    if (!editingProduct?.short_name?.trim()) return alert('Short code is required.');

    try {
      setSaving(true);
      await upsertProduct({
        id: editingProduct.id,
        organization_id: ORG_ID,
        name: editingProduct.name.trim(),
        short_name: editingProduct.short_name.trim().toUpperCase(),
        is_active: editingProduct.is_active ?? true,
        sort_order: editingProduct.sort_order ?? products.length + 1,
      });
      await refetchProducts();
      setProductModalOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      alert('Error saving product: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleProductStatus = async (p: ProductWithRanges) => {
    try {
      await upsertProduct({ id: p.id, is_active: !p.is_active });
      await refetchProducts();
    } catch (err: any) {
      alert('Error updating product status: ' + err.message);
    }
  };

  // ── RANGE HANDLERS ──
  const handleSaveRange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRange?.label?.trim()) return alert('Label is required (e.g. 250 ml).');
    if (!editingRange?.quantity || editingRange.quantity <= 0) return alert('Valid quantity is required.');
    if (!editingRange?.productId && !editingRange?.product_id) return alert('Product ID is missing.');

    const qty = Number(editingRange.quantity);
    const unit = editingRange.unit || 'ML';
    const lpu = (unit === 'ML' || unit === 'GM') ? qty / 1000 : qty;

    try {
      setSaving(true);
      await upsertRange({
        id: editingRange.id,
        product_id: editingRange.productId || editingRange.product_id,
        label: editingRange.label.trim(),
        quantity: qty,
        unit: unit,
        litres_per_unit: lpu,
        is_active: editingRange.is_active ?? true,
        sort_order: editingRange.sort_order ?? 1,
      });
      await refetchProducts();
      setRangeModalOpen(false);
      setEditingRange(null);
    } catch (err: any) {
      alert('Error saving range: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleRangeStatus = async (r: ProductRange) => {
    try {
      await upsertRange({ ...r, is_active: !r.is_active });
      await refetchProducts();
    } catch (err: any) {
      alert('Error updating range status: ' + err.message);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'routes',   label: 'Routes',   icon: <MapPin size={15} /> },
    { key: 'shops',    label: 'Shops',    icon: <Store size={15} /> },
    { key: 'products', label: 'Products', icon: <Package size={15} /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <h2 className="section-header">Configuration</h2>
        <p className="text-sm text-slate-400 mt-0.5">Manage routes, assign shops, configure products & pack sizes.</p>

        {/* Main Tab selector */}
        <div className="flex gap-1 mt-4 bg-slate-100 p-1 rounded-xl w-fit">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all
                ${activeTab === t.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-4">

          {/* ── ROUTES TAB ── */}
          {activeTab === 'routes' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800 text-sm">Route Managers</p>
                  <p className="text-xs text-slate-400">Add or edit delivery routes</p>
                </div>
                <button
                  onClick={() => { setEditingRoute({ is_active: true }); setRouteModalOpen(true); }}
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <Plus size={13} /> Add Route
                </button>
              </div>
              <ul className="divide-y divide-slate-100">
                {routeManagers.map(rm => (
                  <li key={rm.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                        <MapPin size={14} className="text-brand-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{rm.name}</p>
                        {rm.phone && <p className="text-xs text-slate-400">{rm.phone}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRouteStatus(rm)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                      >
                        {rm.is_active ? <ToggleRight size={22} className="text-brand-600" /> : <ToggleLeft size={22} />}
                      </button>
                      <button
                        onClick={() => { setEditingRoute(rm); setRouteModalOpen(true); }}
                        className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
                      >
                        <Pencil size={11} /> Edit
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── SHOPS TAB ── */}
          {activeTab === 'shops' && (
            <div className="space-y-4">
              {/* Route Sub-tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Filter Route:</span>
                <button
                  onClick={() => setShopRouteSubTab('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
                    ${shopRouteSubTab === 'all'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  All Shops ({shops.length})
                </button>
                {routeManagers.map(rm => {
                  const count = shops.filter(s => s.route_manager_id === rm.id).length;
                  return (
                    <button
                      key={rm.id}
                      onClick={() => setShopRouteSubTab(rm.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5
                        ${shopRouteSubTab === rm.id
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      <MapPin size={11} />
                      {rm.name} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Shops Table Card */}
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      {shopRouteSubTab === 'all'
                        ? 'All Shops Directory'
                        : `${routeManagers.find(r => r.id === shopRouteSubTab)?.name || 'Route'} Shops`}
                      <span className="text-slate-400 font-normal ml-2">({filteredShops.length})</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {shopRouteSubTab === 'all'
                        ? 'Showing shops from all routes. Assign or change route manager per shop.'
                        : `Showing shops assigned to ${routeManagers.find(r => r.id === shopRouteSubTab)?.name}.`}
                    </p>
                  </div>
                  <button
                    onClick={handleAddShopClick}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                  >
                    <Plus size={13} /> Add New Shop
                  </button>
                </div>

                <ul className="divide-y divide-slate-100">
                  {filteredShops.length === 0 ? (
                    <li className="p-8 text-center text-slate-400 text-sm">
                      No shops found for this route manager. Click "Add New Shop" to add one!
                    </li>
                  ) : (
                    filteredShops.map(shop => (
                      <li key={shop.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-800 text-sm">{shop.name}</p>
                            {shop.code && (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{shop.code}</span>
                            )}
                            {!shop.is_active && (
                              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">Inactive</span>
                            )}
                          </div>
                        </div>

                        {/* Route Manager Selection */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="relative">
                            <select
                              value={shop.route_manager_id || ''}
                              onChange={e => handleAssignRoute(shop, e.target.value)}
                              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            >
                              <option value="" disabled>— Assign Route —</option>
                              {routeManagers.map(rm => (
                                <option key={rm.id} value={rm.id}>{rm.name}</option>
                              ))}
                            </select>
                          </div>

                          <button
                            onClick={() => toggleShopStatus(shop)}
                            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                            title={shop.is_active ? 'Deactivate Shop' : 'Activate Shop'}
                          >
                            {shop.is_active ? <ToggleRight size={22} className="text-brand-600" /> : <ToggleLeft size={22} />}
                          </button>

                          <button
                            onClick={() => { setEditingShop(shop); setShopModalOpen(true); }}
                            className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
                          >
                            <Pencil size={11} /> Edit
                          </button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* ── PRODUCTS TAB ── */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <p className="font-bold text-slate-800 text-sm">Products & Pack Sizes</p>
                  <p className="text-xs text-slate-400">Manage milk, curd, taak products and their SKU sizes</p>
                </div>
                <button
                  onClick={() => { setEditingProduct({ is_active: true }); setProductModalOpen(true); }}
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Product
                </button>
              </div>

              {products.map(product => (
                <div key={product.id} className="card overflow-hidden">
                  <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white bg-brand-600 px-2 py-0.5 rounded-md">{product.short_name}</span>
                      <span className="font-bold text-slate-800">{product.name}</span>
                      {!product.is_active && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleProductStatus(product)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                      >
                        {product.is_active ? <ToggleRight size={22} className="text-brand-600" /> : <ToggleLeft size={22} />}
                      </button>
                      <button
                        onClick={() => { setEditingProduct(product); setProductModalOpen(true); }}
                        className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
                      >
                        <Pencil size={11} /> Edit
                      </button>
                    </div>
                  </div>

                  <div className="px-5 py-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="label-xs">Pack Sizes (Ranges)</p>
                      <button
                        onClick={() => { setEditingRange({ productId: product.id, is_active: true, unit: 'ML' }); setRangeModalOpen(true); }}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                      >
                        <Plus size={12} /> Add Range
                      </button>
                    </div>

                    {product.product_ranges.length === 0 ? (
                      <p className="text-sm text-slate-400 italic py-2">No ranges configured.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-[11px] text-slate-400 uppercase font-semibold">
                              <th className="text-left py-2 pr-4">Label</th>
                              <th className="text-left py-2 pr-4">Qty</th>
                              <th className="text-left py-2 pr-4">Unit</th>
                              <th className="text-left py-2 pr-4">Litres/unit</th>
                              <th className="text-left py-2 pr-4">Status</th>
                              <th className="text-right py-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {product.product_ranges.map(range => (
                              <tr key={range.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                                <td className="py-2.5 pr-4 font-semibold text-slate-800">{range.label}</td>
                                <td className="py-2.5 pr-4 text-slate-500">{range.quantity}</td>
                                <td className="py-2.5 pr-4 text-slate-500">{range.unit}</td>
                                <td className="py-2.5 pr-4 font-mono text-xs text-brand-700">{range.litres_per_unit?.toFixed(3)}</td>
                                <td className="py-2.5 pr-4">
                                  <button
                                    onClick={() => toggleRangeStatus(range)}
                                    className="cursor-pointer"
                                  >
                                    {range.is_active
                                      ? <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">Active</span>
                                      : <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">Inactive</span>
                                    }
                                  </button>
                                </td>
                                <td className="py-2.5 text-right">
                                  <button
                                    onClick={() => { setEditingRange(range); setRangeModalOpen(true); }}
                                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 ml-auto"
                                  >
                                    <Pencil size={10} /> Edit
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── MODAL: ROUTE MANAGER ── */}
      {routeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingRoute?.id ? 'Edit Route Manager' : 'Add Route Manager'}
              </h3>
              <button onClick={() => setRouteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveRoute} className="space-y-4">
              <div>
                <label className="label-xs mb-1 block">Route Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Route A or North Route"
                  value={editingRoute?.name || ''}
                  onChange={e => setEditingRoute({ ...editingRoute, name: e.target.value })}
                  className="input-base text-sm"
                  required
                />
              </div>
              <div>
                <label className="label-xs mb-1 block">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={editingRoute?.phone || ''}
                  onChange={e => setEditingRoute({ ...editingRoute, phone: e.target.value })}
                  className="input-base text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setRouteModalOpen(false)} className="btn-secondary text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SHOP ── */}
      {shopModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingShop?.id ? 'Edit Shop' : 'Add New Shop'}
              </h3>
              <button onClick={() => setShopModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveShop} className="space-y-4">
              <div>
                <label className="label-xs mb-1 block">Shop Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Siddheshwar Gruh Vastu Bandar"
                  value={editingShop?.name || ''}
                  onChange={e => setEditingShop({ ...editingShop, name: e.target.value })}
                  className="input-base text-sm"
                  required
                />
              </div>
              <div>
                <label className="label-xs mb-1 block">Shop Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. SGVB"
                  value={editingShop?.code || ''}
                  onChange={e => setEditingShop({ ...editingShop, code: e.target.value })}
                  className="input-base text-sm"
                />
              </div>
              <div>
                <label className="label-xs mb-1 block">Route Manager (Compulsory) *</label>
                <select
                  value={editingShop?.route_manager_id || ''}
                  onChange={e => setEditingShop({ ...editingShop, route_manager_id: e.target.value })}
                  className="input-base text-sm appearance-none"
                  required
                >
                  <option value="" disabled>— Select Route Manager —</option>
                  {routeManagers.map(rm => (
                    <option key={rm.id} value={rm.id}>{rm.name}</option>
                  ))}
                </select>
                {editingShop?.route_manager_id && shopRouteSubTab !== 'all' && (
                  <p className="mt-1 text-[11px] text-green-600 font-semibold flex items-center gap-1">
                    ✓ Auto-selected from active route sub-tab: {routeManagers.find(r => r.id === editingShop.route_manager_id)?.name}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShopModalOpen(false)} className="btn-secondary text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: PRODUCT ── */}
      {productModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingProduct?.id ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="label-xs mb-1 block">Product Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Full Cream Milk"
                  value={editingProduct?.name || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="input-base text-sm"
                  required
                />
              </div>
              <div>
                <label className="label-xs mb-1 block">Short Code *</label>
                <input
                  type="text"
                  placeholder="e.g. FCM"
                  value={editingProduct?.short_name || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, short_name: e.target.value })}
                  className="input-base text-sm uppercase"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setProductModalOpen(false)} className="btn-secondary text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: PRODUCT RANGE ── */}
      {rangeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingRange?.id ? 'Edit Pack Size' : 'Add Pack Size Range'}
              </h3>
              <button onClick={() => setRangeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveRange} className="space-y-4">
              <div>
                <label className="label-xs mb-1 block">Display Label *</label>
                <input
                  type="text"
                  placeholder="e.g. 500 ml"
                  value={editingRange?.label || ''}
                  onChange={e => setEditingRange({ ...editingRange, label: e.target.value })}
                  className="input-base text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-xs mb-1 block">Quantity *</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={editingRange?.quantity || ''}
                    onChange={e => setEditingRange({ ...editingRange, quantity: Number(e.target.value) })}
                    className="input-base text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="label-xs mb-1 block">Unit *</label>
                  <select
                    value={editingRange?.unit || 'ML'}
                    onChange={e => setEditingRange({ ...editingRange, unit: e.target.value })}
                    className="input-base text-sm appearance-none"
                    required
                  >
                    <option value="ML">ML</option>
                    <option value="GM">GM</option>
                    <option value="L">L</option>
                    <option value="KG">KG</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setRangeModalOpen(false)} className="btn-secondary text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Pack Size'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
