import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

export interface AnalysisRecord {
  id: string;
  timestamp: string;
  job_title: string;
  company_name: string;
  sender_info: string;
  channel: string;
  risk_category: 'Genuine' | 'Suspicious' | 'Fraudulent';
  risk_score: number;
  heuristic_score: number;
  model_score: number | null;
  summary: string;
  raw_text: string;
  flags_json: string;
  recommendations_json: string;
  model_verdict_json: string | null;
  is_starred: number;
}

let db: Database | null = null;
let memoryStore: AnalysisRecord[] = [];
let isInitialized = false;

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isVercel ? path.join('/tmp', 'data') : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'scam_detection.db');

export async function initDb(): Promise<Database | null> {
  if (isInitialized) return db;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Could not create data directory, proceeding in-memory:', err);
  }

  try {
    const SQL = await initSqlJs();

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileBuffer = fs.readFileSync(DB_FILE);
        db = new SQL.Database(fileBuffer);
      } catch (err) {
        console.warn('Failed to load existing DB file, creating new database:', err);
        db = new SQL.Database();
      }
    } else {
      db = new SQL.Database();
    }

    // Create table
    db.run(`
      CREATE TABLE IF NOT EXISTS analysis_records (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        job_title TEXT,
        company_name TEXT,
        sender_info TEXT,
        channel TEXT,
        risk_category TEXT NOT NULL,
        risk_score INTEGER NOT NULL,
        heuristic_score INTEGER NOT NULL,
        model_score INTEGER,
        summary TEXT,
        raw_text TEXT NOT NULL,
        flags_json TEXT NOT NULL,
        recommendations_json TEXT NOT NULL,
        model_verdict_json TEXT,
        is_starred INTEGER DEFAULT 0
      );
    `);

  } catch (err) {
    console.warn('[Storage] SQLite WebAssembly init failed or unavailable in this environment, using memory store:', err);
    db = null;
  }

  isInitialized = true;
  return db;
}

function saveDb() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.warn('Could not persist SQLite database to disk (ephemeral storage):', err);
  }
}

export function clearAllRecords(): boolean {
  memoryStore = [];
  if (db) {
    try {
      db.run('DELETE FROM analysis_records');
      saveDb();
    } catch (err) {
      console.warn('Failed to clear records in SQLite:', err);
    }
  }
  return true;
}

export function insertRecord(record: AnalysisRecord): void {
  // Always update in-memory store (newest first, avoid duplicates)
  memoryStore = [record, ...memoryStore.filter(r => r.id !== record.id)].slice(0, 100);

  if (db) {
    try {
      db.run(
        `INSERT INTO analysis_records (
          id, timestamp, job_title, company_name, sender_info, channel,
          risk_category, risk_score, heuristic_score, model_score, summary,
          raw_text, flags_json, recommendations_json, model_verdict_json, is_starred
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.timestamp,
          record.job_title,
          record.company_name,
          record.sender_info,
          record.channel,
          record.risk_category,
          record.risk_score,
          record.heuristic_score,
          record.model_score,
          record.summary,
          record.raw_text,
          record.flags_json,
          record.recommendations_json,
          record.model_verdict_json,
          record.is_starred
        ]
      );
      saveDb();
    } catch (err) {
      console.warn('Failed to insert record into SQLite:', err);
    }
  }
}

export function getRecords(search?: string, category?: string): AnalysisRecord[] {
  if (db) {
    try {
      let query = 'SELECT * FROM analysis_records';
      const params: any[] = [];
      const whereClauses: string[] = [];

      if (category && category !== 'ALL') {
        whereClauses.push('risk_category = ?');
        params.push(category);
      }

      if (search && search.trim().length > 0) {
        whereClauses.push('(job_title LIKE ? OR company_name LIKE ? OR sender_info LIKE ? OR raw_text LIKE ?)');
        const term = `%${search.trim()}%`;
        params.push(term, term, term, term);
      }

      if (whereClauses.length > 0) {
        query += ' WHERE ' + whereClauses.join(' AND ');
      }

      query += ' ORDER BY timestamp DESC';

      const stmt = db.prepare(query);
      if (params.length > 0) {
        stmt.bind(params);
      }

      const results: AnalysisRecord[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject() as any;
        results.push(row as AnalysisRecord);
      }
      stmt.free();

      return results;
    } catch (err) {
      console.warn('Failed to query SQLite, falling back to memory store:', err);
    }
  }

  // Fallback to memoryStore
  let filtered = [...memoryStore];
  if (category && category !== 'ALL') {
    filtered = filtered.filter(r => r.risk_category === category);
  }
  if (search && search.trim().length > 0) {
    const s = search.trim().toLowerCase();
    filtered = filtered.filter(r =>
      (r.job_title || '').toLowerCase().includes(s) ||
      (r.company_name || '').toLowerCase().includes(s) ||
      (r.sender_info || '').toLowerCase().includes(s) ||
      (r.raw_text || '').toLowerCase().includes(s)
    );
  }
  return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getRecordById(id: string): AnalysisRecord | null {
  if (db) {
    try {
      const stmt = db.prepare('SELECT * FROM analysis_records WHERE id = ?');
      stmt.bind([id]);
      let record: AnalysisRecord | null = null;
      if (stmt.step()) {
        record = stmt.getAsObject() as any;
      }
      stmt.free();
      if (record) return record;
    } catch (err) {
      console.warn('Failed to get record from SQLite, using memory:', err);
    }
  }
  return memoryStore.find(r => r.id === id) || null;
}

export function deleteRecord(id: string): boolean {
  memoryStore = memoryStore.filter(r => r.id !== id);
  if (db) {
    try {
      db.run('DELETE FROM analysis_records WHERE id = ?', [id]);
      saveDb();
    } catch (err) {
      console.warn('Failed to delete record from SQLite:', err);
    }
  }
  return true;
}

export function toggleStar(id: string): boolean {
  memoryStore = memoryStore.map(r =>
    r.id === id ? { ...r, is_starred: r.is_starred === 1 ? 0 : 1 } : r
  );
  if (db) {
    try {
      db.run('UPDATE analysis_records SET is_starred = CASE WHEN is_starred = 1 THEN 0 ELSE 1 END WHERE id = ?', [id]);
      saveDb();
    } catch (err) {
      console.warn('Failed to toggle star in SQLite:', err);
    }
  }
  return true;
}

export function getDatabaseStats() {
  if (db) {
    try {
      const totalRes = db.exec('SELECT COUNT(*) as count FROM analysis_records');
      const total = (totalRes[0]?.values[0]?.[0] as number) || 0;

      const catRes = db.exec(`
        SELECT risk_category, COUNT(*) as count 
        FROM analysis_records 
        GROUP BY risk_category
      `);

      const categoryCounts: Record<string, number> = {
        Genuine: 0,
        Suspicious: 0,
        Fraudulent: 0
      };

      if (catRes.length > 0) {
        for (const row of catRes[0].values) {
          const cat = String(row[0]);
          const countVal = Number(row[1]);
          categoryCounts[cat] = countVal;
        }
      }

      const avgScoreRes = db.exec('SELECT AVG(risk_score) FROM analysis_records');
      const avgRiskScore = Math.round((avgScoreRes[0]?.values[0]?.[0] as number) || 0);

      return {
        totalScans: total,
        categoryCounts,
        avgRiskScore
      };
    } catch (err) {
      console.warn('Failed to compute SQLite stats, using memory store:', err);
    }
  }

  // Memory stats
  const categoryCounts = { Genuine: 0, Suspicious: 0, Fraudulent: 0 };
  let totalScore = 0;
  for (const r of memoryStore) {
    if (categoryCounts[r.risk_category] !== undefined) {
      categoryCounts[r.risk_category]++;
    }
    totalScore += r.risk_score || 0;
  }
  return {
    totalScans: memoryStore.length,
    categoryCounts,
    avgRiskScore: memoryStore.length > 0 ? Math.round(totalScore / memoryStore.length) : 0
  };
}
