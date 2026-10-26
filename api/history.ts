import { initDb, getRecords, deleteRecord, toggleStar } from '../server/db.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDb();

    if (req.method === 'GET') {
      const search = req.query?.search as string | undefined;
      const category = req.query?.category as string | undefined;
      const rawRecords = getRecords(search, category);

      const parsedRecords = rawRecords.map(r => ({
        ...r,
        flags: JSON.parse(r.flags_json || '[]'),
        recommendations: JSON.parse(r.recommendations_json || '[]'),
        model_verdict: r.model_verdict_json ? JSON.parse(r.model_verdict_json) : null
      }));

      return res.status(200).json({ records: parsedRecords });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: 'Record ID is required for deletion.' });
      }
      deleteRecord(String(id));
      return res.status(200).json({ success: true, message: 'Record deleted successfully.' });
    }

    if (req.method === 'PATCH') {
      const id = req.query?.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: 'Record ID is required.' });
      }
      toggleStar(String(id));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (err: any) {
    console.error('Error in /api/history serverless handler:', err);
    return res.status(200).json({ records: [] });
  }
}
