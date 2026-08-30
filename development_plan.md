# Chaturthi Enterprises — Milk Distribution Management Panel
## Development Plan

**Application:** Chaturthi Enterprises
**Frontend:** ReactJS + Vite + TypeScript
**Backend/DB:** Supabase PostgreSQL
**Design:** Mobile-first, responsive Web App / PWA-ready
**Core Objective:** Lightweight Milk Distribution Management Panel with 3 primary sections: Form (Mobile first), Dashboard, Configuration.

### Architectural Principles
- **No Hardcoded Configurations:** Form must never hardcode product ranges. The Form is generated dynamically from Configuration.
- **Mobile-first:** Form optimized for 360px-430px and scales to desktop. Dashboard & Config work well on both.
- **Zero-entry:** Do not force users to enter `0`. Empty fields remain visually empty.

### Phase 1: Project Setup
- [ ] Initialize React + Vite + TypeScript project.
- [ ] Install dependencies: Tailwind CSS, Supabase, React Router, Recharts, Lucide React, ExcelJS, jsPDF, html2canvas.
- [ ] Configure standard project structure (`src/components`, `src/pages`, `src/services`, `src/utils`, `src/types`).

### Phase 2: Supabase SQL Schema
- [ ] Create `database/schema.sql` (Organizations, Shops, Products, Product Ranges, Daily Entries, Daily Entry Items).
- [ ] Setup Row Level Security (RLS) policies.
- [ ] Set up `utils/conversion.ts` for calculations.

### Phase 3: Seed Existing Data
- [ ] Create `database/seed.sql`.
- [ ] Seed base organization: "Chaturthi Enterprises".
- [ ] Seed default products: FCM, SM, TM, CURD, TAAK.
- [ ] Seed default product ranges and shops.

### Phase 4: Configuration UI
- [ ] Implement Shops config: List, Add, Edit, Activate/Deactivate.
- [ ] Implement Products config: List, Add, Edit, Activate/Deactivate.
- [ ] Implement Product Ranges config: Link to Products, Quantities, Units, Liter Conversion.

### Phase 5: Mobile Form
- [ ] Date selection (default to today).
- [ ] Shop selection (dynamic dropdown).
- [ ] Dynamic products and ranges layout (cards for mobile, table for desktop).
- [ ] Input fields for units (numeric only).
- [ ] Real-time total litres and units calculation at the bottom.

### Phase 6: Submission + Editing
- [ ] Handle duplicate check rule: One entry per Date + Shop.
- [ ] Save to `daily_entries` and `daily_entry_items` with snapshot of conversion rate.
- [ ] Implement "Edit existing entry" flow.

### Phase 7: Dashboard
- [ ] Global state for filters: Date Range, Shop, Product, Range.
- [ ] KPI Cards: Total Litres, Total Units, Total Shops, Total Entries.
- [ ] Charts: Product-wise Litres (Bar), Daily Litres Trend (Line), Shop-wise (Bar).
- [ ] Detailed Paginated Table.

### Phase 8: Excel Export
- [ ] Implement `ExcelJS` export honoring the exact Dashboard filters.
- [ ] Generate 5 Sheets: Summary, Detailed Data, Product Summary, Shop Summary, Range Summary.
- [ ] Format appropriately with company headers.

### Phase 9: Dashboard PDF Export
- [ ] Create `DashboardReportView` for printing.
- [ ] Honor exact Dashboard filters.
- [ ] Capture/Render UI to PDF containing Filters, KPIs, Charts, and Table.

### Phase 10: Responsive Polish
- [ ] Ensure large touch targets and numeric keyboard on mobile forms.
- [ ] Verify loading, empty, and error states across all screens.
- [ ] Prevent blank screens.

### Phase 11: Testing
- [ ] Verify unit-to-litre conversion logic.
- [ ] Test multiple ranges, empty fields, configuration changes (historical data protection).
- [ ] Test exact filters for Dashboard and Exports.
- [ ] Mobile responsive test (360px - 412px).

### Phase 12: Deployment
- [ ] Finalize environment variables.
- [ ] Deploy to CodeSandbox/Vercel/Netlify.
