import { Outlet, NavLink } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, Settings } from 'lucide-react';

export function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 md:flex-row">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-slate-200 sticky top-0">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">CE</span>
            </div>
            <div>
              <p className="text-[13px] font-bold text-slate-900 leading-tight">Chaturthi</p>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest leading-tight">Enterprises</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/" end className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'nav-active' : 'nav-inactive'}`
          }>
            <ClipboardList size={18} />
            <span>Daily Form</span>
          </NavLink>

          <NavLink to="/dashboard" className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'nav-active' : 'nav-inactive'}`
          }>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/config" className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'nav-active' : 'nav-inactive'}`
          }>
            <Settings size={18} />
            <span>Configuration</span>
          </NavLink>
        </nav>

        <div className="px-6 py-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-300 uppercase tracking-widest font-medium">Milk Distribution v1</p>
        </div>
      </aside>

      {/* ── Mobile Top Header ── */}
      <header className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-center gap-2">
          <div className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">CE</span>
          </div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Chaturthi Enterprises</h1>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0 overflow-y-auto min-h-screen">
        <Outlet />
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30">
        <div className="flex justify-around items-center pb-safe">
          <NavLink to="/" end className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-3 px-6 transition-all ${isActive ? 'text-brand-600' : 'text-slate-400'}`
          }>
            <ClipboardList size={22} />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Form</span>
          </NavLink>

          <NavLink to="/dashboard" className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-3 px-6 transition-all ${isActive ? 'text-brand-600' : 'text-slate-400'}`
          }>
            <LayoutDashboard size={22} />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Dashboard</span>
          </NavLink>

          <NavLink to="/config" className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-3 px-6 transition-all ${isActive ? 'text-brand-600' : 'text-slate-400'}`
          }>
            <Settings size={22} />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Config</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
