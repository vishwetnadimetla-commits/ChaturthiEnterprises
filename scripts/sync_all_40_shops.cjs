const { Client } = require('pg');

const connectionString = 'postgresql://postgres:chaturthi%40123@db.orcblzsggomigabcnnlo.supabase.co:5432/postgres';
const ORG_ID = '11111111-0000-0000-0000-000000000001';
const DEFAULT_ROUTE_ID = '22220000-0000-0000-0000-000000000001'; // Route A

const ALL_40_SHOPS = [
  "Gopi Kishan Traders",
  "Siddheshwar Gruh Vastu Bandar",
  "Masan Kirana",
  "Adam Kirana",
  "Pulgam Kirana",
  "Mudgonda Kirana",
  "Shiram Kirana",
  "Vedant Kirana - Yerva",
  "Banda Kirana",
  "Tautam Kirana",
  "Riddhi Siddhi Shegur Kirana",
  "Potu Kirana",
  "Bitla Kirana",
  "Zalke Kirana",
  "Sutar Kirana",
  "Fatate Kirana",
  "Vadnal Kirana",
  "Godake Kirana",
  "Umar Farooq Kirana",
  "Rangdal Kirana",
  "Ali Kirana",
  "Venkateshwara Kirana",
  "Inamdar Kirana",
  "Welcome Kirana",
  "Nabilal Kirana 1",
  "Nabilal Kirana 2",
  "SM Kirana",
  "Bandenawaz Kirana",
  "Aslam Kirana",
  "Samartha Kirana",
  "Pashva Kirana",
  "Todkari Kirana",
  "Veerappa Kirana",
  "Kinagi Kirana",
  "Veer Bhadreshwar Kirana",
  "Bhagwan Kirana",
  "Hamid Kirana",
  "Samal Kirana",
  "Hippargi Shop",
  "Solapure Kirana"
];

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to PostgreSQL Supabase');

  let addedCount = 0;
  for (let i = 0; i < ALL_40_SHOPS.length; i++) {
    const name = ALL_40_SHOPS[i];
    const hexIndex = (i + 1).toString(16).padStart(12, '0');
    const shopId = `55550000-0000-0000-0000-${hexIndex}`;
    const code = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 6);

    const res = await client.query(`
      INSERT INTO shops (id, organization_id, route_manager_id, name, code, is_active, sort_order)
      VALUES ($1, $2, $3, $4, $5, true, $6)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;
    `, [shopId, ORG_ID, DEFAULT_ROUTE_ID, name, code, i + 1]);

    if (res.rowCount > 0) addedCount++;
  }

  const totalShopsInDb = await client.query('SELECT count(*) FROM shops');
  console.log(`Successfully synced all 40 Google Form shops! Total shops in DB: ${totalShopsInDb.rows[0].count}`);

  await client.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
