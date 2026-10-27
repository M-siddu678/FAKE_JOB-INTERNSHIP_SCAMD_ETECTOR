import { initDb, getRecords, insertRecord, deleteRecord, toggleStar, clearAllRecords } from '../server/db.js';

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

      const parsedRecords = rawRecords
        .filter(r => !String(r.id).startsWith('scan-demo-'))
        .map(r => ({
          ...r,
          flags: JSON.parse(r.flags_json || '[]'),
          recommendations: JSON.parse(r.recommendations_json || '[]'),
          model_verdict: r.model_verdict_json ? JSON.parse(r.model_verdict_json) : null
        }));

      return res.status(200).json({ records: parsedRecords });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          // keep as is
        }
      }
      const record = body?.record || body;
      if (!record || !record.id) {
        return res.status(400).json({ error: 'Valid record data with id is required.' });
      }

      insertRecord({
        id: String(record.id),
        timestamp: record.timestamp || new Date().toISOString(),
        job_title: record.job_title || 'Job / Internship Offer',
        company_name: record.company_name || 'Unspecified Company',
        sender_info: record.sender_info || 'Direct message',
        channel: record.channel || 'Direct Message',
        risk_category: record.risk_category || 'Suspicious',
        risk_score: Number(record.risk_score || 0),
        heuristic_score: Number(record.heuristic_score || record.risk_score || 0),
        model_score: record.model_score !== undefined ? record.model_score : null,
        summary: record.summary || '',
        raw_text: record.raw_text || '',
        flags_json: typeof record.flags === 'string' ? record.flags : JSON.stringify(record.flags || []),
        recommendations_json: typeof record.recommendations === 'string' ? record.recommendations : JSON.stringify(record.recommendations || []),
        model_verdict_json: record.model_verdict ? JSON.stringify(record.model_verdict) : null,
        is_starred: record.is_starred ? 1 : 0
      });

      return res.status(200).json({ success: true, id: record.id });
    }

    if (req.method === 'DELETE') {
      const isClearAll = req.query?.clearAll === 'true' || req.body?.clearAll === true;
      if (isClearAll) {
        clearAllRecords();
        return res.status(200).json({ success: true, message: 'All records cleared.' });
      }

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
