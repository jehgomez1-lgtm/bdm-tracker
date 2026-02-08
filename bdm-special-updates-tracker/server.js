
import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
// Serve static files from the current directory
app.use(express.static('.'));

/**
 * POSTGRESQL CONFIGURATION
 */
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'datalink_db',
  password: 'jerah415115', 
  port: 5432,
  ssl: false 
});

/**
 * DATABASE INITIALIZATION
 */
const initDb = async () => {
  const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS member_records (
      id TEXT PRIMARY KEY,
      province TEXT,
      municipality TEXT,
      barangay TEXT,
      "memberName" TEXT,
      "updateType" TEXT,
      "granteeName" TEXT,
      date DATE,
      period INTEGER,
      status TEXT,
      "statusDate1" DATE,
      "status2" TEXT,
      "statusDate2" DATE,
      "extraInfo" TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "user" TEXT,
      action TEXT,
      details TEXT
    );
  `;
  try {
    await pool.query(createTablesQuery);
    console.log('\x1b[32m%s\x1b[0m', '--- DATABASE READY: TABLES VERIFIED ---');
    console.log('Your local node bridge is now active and synchronized.');
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '--- DATABASE INIT ERROR ---');
    console.error('Make sure you created the database named "datalink_db" in pgAdmin.');
    console.error(err.message);
  }
};

initDb();

/**
 * BRIDGE STATUS PAGE (Port 3001)
 * This page replaces the "Cannot GET /" error with a helpful UI.
 */
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>BDM Bridge Status</title>
        <style>
            body { font-family: -apple-system, system-ui, sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .container { background: #1e293b; padding: 48px; border-radius: 32px; text-align: center; border: 1px solid #334155; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); max-width: 450px; }
            .icon { background: #4f46e5; width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 24px; }
            h1 { font-size: 24px; font-weight: 800; margin: 0 0 12px; color: #f8fafc; letter-spacing: -0.02em; }
            p { color: #94a3b8; line-height: 1.6; margin-bottom: 32px; font-size: 15px; }
            .status-badge { display: inline-flex; align-items: center; background: #064e3b; color: #4ade80; padding: 6px 12px; border-radius: 99px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 24px; }
            .btn { background: #4f46e5; color: white; text-decoration: none; padding: 16px 32px; border-radius: 16px; font-weight: 700; display: block; transition: all 0.2s; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); }
            .btn:hover { background: #6366f1; transform: translateY(-2px); }
            .footer-info { margin-top: 32px; padding-top: 24px; border-top: 1px solid #334155; font-size: 11px; color: #475569; display: flex; justify-content: space-around; }
            .port-box b { color: #818cf8; display: block; margin-bottom: 2px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="status-badge">● Engine Online</div>
            <div class="icon">⚙️</div>
            <h1>BDM Local Bridge</h1>
            <p>Your backend is running and connected to PostgreSQL. To see your actual data dashboard, use the link below:</p>
            
            <a href="http://localhost:3000" class="btn">Open Dashboard (Port 3000)</a>

            <div class="footer-info">
                <div><b>API STATUS</b> Healthy</div>
                <div><b>DB LINK</b> Active</div>
            </div>
        </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.get('/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM member_records) as "totalRecords",
        (SELECT COUNT(*) FROM audit_logs) as "totalLogs",
        (SELECT COUNT(DISTINCT municipality) FROM member_records) as "activeMuncipalities"
    `;
    const result = await pool.query(statsQuery);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/filter-stats', async (req, res) => {
  try {
    const muni = req.query.municipality || '';
    let where = '';
    let params = [];
    if (muni) {
      where = 'WHERE municipality = $1';
      params = [muni];
    }
    const barangays = await pool.query(`SELECT barangay, COUNT(*) as count FROM member_records ${where} GROUP BY barangay ORDER BY count DESC LIMIT 100`, params);
    const types = await pool.query(`SELECT "updateType", COUNT(*) as count FROM member_records ${where} GROUP BY "updateType" ORDER BY count DESC`, params);
    const munis = await pool.query(`SELECT municipality, COUNT(*) as count FROM member_records GROUP BY municipality ORDER BY count DESC`);
    res.json({ barangays: barangays.rows, updateTypes: types.rows, municipalities: munis.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/records', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const municipality = req.query.municipality || '';
  const barangay = req.query.barangay || '';
  const type = req.query.type || '';
  const period = req.query.period || '';
  const grantee = req.query.grantee || '';
  let whereClauses = [];
  let params = [];
  let paramIndex = 1;
  if (search) { whereClauses.push(`("memberName" ILIKE $${paramIndex} OR id ILIKE $${paramIndex})`); params.push(`%${search}%`); paramIndex++; }
  if (municipality) { whereClauses.push(`municipality = $${paramIndex}`); params.push(municipality); paramIndex++; }
  if (barangay) { whereClauses.push(`barangay = $${paramIndex}`); params.push(barangay); paramIndex++; }
  if (type) { whereClauses.push(`"updateType" = $${paramIndex}`); params.push(type); paramIndex++; }
  if (period) { whereClauses.push(`period = $${paramIndex}`); params.push(parseInt(period)); paramIndex++; }
  if (grantee) { whereClauses.push(`"granteeName" ILIKE $${paramIndex}`); params.push(`%${grantee}%`); paramIndex++; }
  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  try {
    const countRes = await pool.query(`SELECT COUNT(*) as total FROM member_records ${whereSql}`, params);
    const totalRecords = parseInt(countRes.rows[0].total);
    const totalPages = Math.ceil(totalRecords / limit);
    const dataRes = await pool.query(`SELECT * FROM member_records ${whereSql} ORDER BY date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, limit, offset]);
    res.json({ data: dataRes.rows, pagination: { totalRecords, totalPages, currentPage: page, limit } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/records', async (req, res) => {
  const q = `INSERT INTO member_records (id, province, municipality, barangay, "memberName", "updateType", "granteeName", date, period, status, "statusDate1", "status2", "statusDate2", "extraInfo") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT (id) DO UPDATE SET "memberName" = EXCLUDED."memberName", "updateType" = EXCLUDED."updateType", status = EXCLUDED.status, "statusDate1" = EXCLUDED."statusDate1", "status2" = EXCLUDED."status2", "statusDate2" = EXCLUDED."statusDate2", "extraInfo" = EXCLUDED."extraInfo"`;
  const values = [req.body.id, req.body.province, req.body.municipality, req.body.barangay, req.body.memberName, req.body.updateType, req.body.granteeName, req.body.date, req.body.period, req.body.status, req.body.statusDate1 || null, req.body.status2 || null, req.body.statusDate2 || null, req.body.extraInfo || ''];
  try { await pool.query(q, values); res.json({ message: 'Record saved' }); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/records/:id', async (req, res) => {
  try { await pool.query('DELETE FROM member_records WHERE id = $1', [req.params.id]); res.json({ message: 'Deleted' }); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/logs', async (req, res) => {
  try { const result = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50'); res.json(result.rows); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/logs', async (req, res) => {
  const q = 'INSERT INTO audit_logs (id, timestamp, "user", action, details) VALUES ($1, NOW(), $2, $3, $4)';
  try { await pool.query(q, [req.body.id, req.body.user, req.body.action, req.body.details]); res.json({ message: 'Logged' }); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => {
  console.log(`\x1b[36m%s\x1b[0m`, `Bridge running on http://localhost:${PORT}`);
});
