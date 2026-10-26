import { initDb, getDatabaseStats } from '../server/db.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDb();
    const stats = getDatabaseStats();
    return res.status(200).json(stats);
  } catch (err: any) {
    console.warn('Could not load stats from SQLite:', err);
    return res.status(200).json({
      totalScans: 0,
      categoryCounts: { Genuine: 0, Suspicious: 0, Fraudulent: 0 },
      avgRiskScore: 0
    });
  }
}
