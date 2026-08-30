const { Client } = require('pg');
const ExcelJS = require('exceljs');

const connectionString = 'postgresql://postgres:chaturthi%40123@db.orcblzsggomigabcnnlo.supabase.co:5432/postgres';
const ORG_ID = '11111111-0000-0000-0000-000000000001';
const DEFAULT_ROUTE_ID = '22220000-0000-0000-0000-000000000001'; // Route A

const PRODUCT_IDS = {
  TM:   '33330000-0000-0000-0000-000000000001',
  SM:   '33330000-0000-0000-0000-000000000002',
  FCM:  '33330000-0000-0000-0000-000000000003',
  CURD: '33330000-0000-0000-0000-000000000004',
  TAAK: '33330000-0000-0000-0000-000000000005',
};

const RANGE_MAP = {
  TM:   { id: '44440000-0000-0000-0001-000000000002', qty: 250, unit: 'ML', litres_per_unit: 0.250 }, // 250ml
  SM:   { id: '44440000-0000-0000-0002-000000000002', qty: 500, unit: 'ML', litres_per_unit: 0.500 }, // 500ml
  FCM:  { id: '44440000-0000-0000-0003-000000000002', qty: 500, unit: 'ML', litres_per_unit: 0.500 }, // 500ml
  CURD: { id: '44440000-0000-0000-0004-000000000002', qty: 500, unit: 'GM', litres_per_unit: 0.500 }, // 500gm
  TAAK: { id: '44440000-0000-0000-0005-000000000001', qty: 400, unit: 'ML', litres_per_unit: 0.400 }, // 400ml
};

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to PostgreSQL Supabase');

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('/Users/appristine/Desktop/Vishwet/Experiments/REACT/Milk Dashboard/Daily Milk Route (Responses).xlsx');
  const ws = wb.worksheets[0];

  // 1. Extract unique shops
  const shopMap = new Map();
  let sortOrder = 1;

  ws.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    const name = String(row.getCell(2).value || '').trim();
    if (name && !shopMap.has(name)) {
      const hexIndex = sortOrder.toString(16).padStart(12, '0');
      const shopId = `55550000-0000-0000-0000-${hexIndex}`;
      shopMap.set(name, shopId);
      sortOrder++;
    }
  });

  console.log(`Found ${shopMap.size} unique shops.`);

  // Upsert shops into DB
  for (const [name, id] of shopMap.entries()) {
    const code = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 6);
    await client.query(`
      INSERT INTO shops (id, organization_id, route_manager_id, name, code, is_active, sort_order)
      VALUES ($1, $2, $3, $4, $5, true, 1)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, route_manager_id = EXCLUDED.route_manager_id;
    `, [id, ORG_ID, DEFAULT_ROUTE_ID, name, code]);
  }
  console.log('Shops populated successfully!');

  // 2. Insert daily entries & items
  let entryCount = 0;
  let itemCount = 0;

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const shopName = String(row.getCell(2).value || '').trim();
    if (!shopName) continue;

    const shopId = shopMap.get(shopName);
    const rawDate = row.getCell(8).value || row.getCell(1).value;
    const entryDate = new Date(rawDate).toISOString().split('T')[0];

    const fcmLitres  = Number(row.getCell(3).value || 0);
    const smLitres   = Number(row.getCell(4).value || 0);
    const tmLitres   = Number(row.getCell(5).value || 0);
    const curdLitres = Number(row.getCell(6).value || 0);
    const taakLitres = Number(row.getCell(7).value || 0);

    const totalLitres = fcmLitres + smLitres + tmLitres + curdLitres + taakLitres;

    // Check if entry for date + shop already exists
    const existingRes = await client.query(
      'SELECT id FROM daily_entries WHERE shop_id = $1 AND entry_date = $2',
      [shopId, entryDate]
    );

    let entryId = '';
    if (existingRes.rows.length > 0) {
      entryId = existingRes.rows[0].id;
      await client.query('DELETE FROM daily_entry_items WHERE daily_entry_id = $1', [entryId]);
      await client.query(
        'UPDATE daily_entries SET total_litres = $1 WHERE id = $2',
        [totalLitres, entryId]
      );
    } else {
      const hexIndex = (r - 1).toString(16).padStart(12, '0');
      entryId = `66660000-0000-0000-0000-${hexIndex}`;
      await client.query(`
        INSERT INTO daily_entries (id, organization_id, shop_id, entry_date, total_litres, total_units)
        VALUES ($1, $2, $3, $4, $5, 0);
      `, [entryId, ORG_ID, shopId, entryDate, totalLitres]);
      entryCount++;
    }

    const productEntries = [
      { key: 'FCM',  litres: fcmLitres },
      { key: 'SM',   litres: smLitres },
      { key: 'TM',   litres: tmLitres },
      { key: 'CURD', litres: curdLitres },
      { key: 'TAAK', litres: taakLitres },
    ];

    let totalUnitsForEntry = 0;

    for (const pe of productEntries) {
      if (pe.litres <= 0) continue;

      const pId = PRODUCT_IDS[pe.key];
      const rInfo = RANGE_MAP[pe.key];
      const count = Math.round(pe.litres / rInfo.litres_per_unit);
      totalUnitsForEntry += count;

      await client.query(`
        INSERT INTO daily_entry_items (
          daily_entry_id, product_id, product_range_id, count, unit_quantity, unit, litres_per_unit_snapshot, litres
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        entryId,
        pId,
        rInfo.id,
        count,
        rInfo.qty,
        rInfo.unit,
        rInfo.litres_per_unit,
        pe.litres
      ]);
      itemCount++;
    }

    await client.query('UPDATE daily_entries SET total_units = $1 WHERE id = $2', [totalUnitsForEntry, entryId]);
  }

  console.log(`Successfully migrated ${entryCount} daily entries and ${itemCount} items into Supabase!`);
  await client.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
