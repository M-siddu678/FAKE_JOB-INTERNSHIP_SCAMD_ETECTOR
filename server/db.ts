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
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'scam_detection.db');

export async function initDb(): Promise<Database> {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

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

  // Seed sample records if empty
  const countRes = db.exec("SELECT COUNT(*) as count FROM analysis_records");
  const count = (countRes[0]?.values[0]?.[0] as number) || 0;

  if (count === 0) {
    seedInitialRecords(db);
    saveDb();
  }

  return db;
}

function saveDb() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Error persisting SQLite database to disk:', err);
  }
}

function seedInitialRecords(database: Database) {
  const samples = [
    {
      id: 'scan-demo-001',
      timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      job_title: 'Part-Time Remote Assistant & Data Processor',
      company_name: 'Apex Global E-Commerce',
      sender_info: 'hr-apex@gmail.com',
      channel: 'Telegram / WhatsApp',
      risk_category: 'Fraudulent',
      risk_score: 94,
      heuristic_score: 92,
      model_score: 96,
      summary: 'Critical danger: Requests upfront ₹2,500 "security bond", unrealistic ₹45,000/week pay for 1 hour/day simple copy-paste tasks, and communicates exclusively via Telegram.',
      raw_text: `URGENT HIRING: Part-time Online Data Entry & Product Rating Intern!
Earn ₹45,000 to ₹70,000 per month working just 1-2 hours daily from mobile.
No qualification or experience required! Freshers and college students welcome.
Immediate selection! No interview required.
To activate your merchant terminal, submit refundable verification fee of ₹2,500 to UPI: apexpayment@okaxis.
Contact our HR Manager on Telegram: @apex_hr_recruitment immediately. Slots filling fast!`,
      flags_json: JSON.stringify([
        {
          id: 'flag-fee',
          category: 'FEE_DEMAND',
          label: 'Upfront Registration / Security Fee',
          severity: 'CRITICAL',
          description: 'Demanded ₹2,500 refundable security fee before commencing work.',
          evidenceSnippet: 'submit refundable verification fee of ₹2,500 to UPI: apexpayment@okaxis'
        },
        {
          id: 'flag-salary',
          category: 'COMPENSATION_ANOMALY',
          label: 'Unrealistic Pay for Low-Skill Task',
          severity: 'HIGH',
          description: 'Promised ₹45,000 - ₹70,000/month for 1 hour daily work with zero qualification.',
          evidenceSnippet: 'Earn ₹45,000 to ₹70,000 per month working just 1-2 hours daily'
        },
        {
          id: 'flag-channel',
          category: 'SUSPICIOUS_COMMUNICATION',
          label: 'Informal Channel & Free Domain',
          severity: 'HIGH',
          description: 'Contact directed to personal Telegram handle and free Gmail address.',
          evidenceSnippet: 'Contact our HR Manager on Telegram: @apex_hr_recruitment'
        },
        {
          id: 'flag-no-interview',
          category: 'INTERVIEW_OMISSION',
          label: 'Direct Hire Without Assessment',
          severity: 'MEDIUM',
          description: 'Immediate selection guaranteed without technical or HR evaluation.',
          evidenceSnippet: 'Immediate selection! No interview required.'
        }
      ]),
      recommendations_json: JSON.stringify([
        'DO NOT transfer any money: Legitimate companies never charge registration, kit, or security fees.',
        'Block and report the Telegram handle and associated UPI ID to the National Cyber Crime Reporting Portal (1930 / cybercrime.gov.in).',
        'Verify company authenticity on the Ministry of Corporate Affairs (MCA) database.'
      ]),
      model_verdict_json: JSON.stringify({
        category: 'Fraudulent',
        confidenceScore: 96,
        verdictRationale: 'Classic prepaid task scam targeting college students with bogus high stipends and upfront refundable fee trap.',
        engine: 'Gemini 3.8 Flash'
      }),
      is_starred: 1
    },
    {
      id: 'scan-demo-002',
      timestamp: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
      job_title: 'Graduate Software Engineer Intern (2026 Batch)',
      company_name: 'Infosys Limited',
      sender_info: 'careers@infosys.com',
      channel: 'Official Campus Portal',
      risk_category: 'Genuine',
      risk_score: 8,
      heuristic_score: 5,
      model_score: 10,
      summary: 'Verified legitimate corporate internship invitation from authentic domain with formal multi-round evaluation process and zero monetary requests.',
      raw_text: `Dear Candidate,
We are pleased to invite you to the campus technical assessment for the role of Graduate Software Engineer Trainee at Infosys Limited.
Assessment Date: November 15, 2026
Location: Online Proctored Portal (infosys.com/careers/assessment)
Please note that Infosys never asks for any money, security deposits, or bank card credentials at any stage of the recruitment process.
Please review the syllabus and eligibility criteria on our official portal.
Sincerely,
Campus Talent Acquisition Team, Infosys Limited`,
      flags_json: JSON.stringify([]),
      recommendations_json: JSON.stringify([
        'This offer exhibits standard legitimate recruitment practices with an official corporate domain.',
        'Ensure you only take assessments on verified subdomains (infosys.com).',
        'Confirm assessment schedule with your college placement cell coordinator.'
      ]),
      model_verdict_json: JSON.stringify({
        category: 'Genuine',
        confidenceScore: 95,
        verdictRationale: 'Authentic recruitment communication with domain integrity, explicit anti-fee disclaimer, and formal evaluation steps.',
        engine: 'Gemini 3.8 Flash'
      }),
      is_starred: 0
    },
    {
      id: 'scan-demo-003',
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      job_title: 'Junior Remote Marketing Coordinator',
      company_name: 'Starlight Media Solutions',
      sender_info: 'starlight.careers@yahoo.com',
      channel: 'Direct Email',
      risk_category: 'Suspicious',
      risk_score: 62,
      heuristic_score: 65,
      model_score: 60,
      summary: 'Suspicious: Free email domain (@yahoo.com) used for corporate recruitment, aggressive 24-hour acceptance deadline, and vague job deliverables.',
      raw_text: `Congratulations! Based on your LinkedIn profile, you have been shortlisted for Junior Remote Marketing Coordinator at Starlight Media.
Stipend: $2,800/month.
You must confirm your acceptance within 24 hours by sending scanned copies of your national identity card and utility bill to starlight.careers@yahoo.com.
Failure to reply within 24 hours will result in automatic cancellation. Equipment allowance will be disbursed after verification.`,
      flags_json: JSON.stringify([
        {
          id: 'flag-free-domain',
          category: 'SUSPICIOUS_COMMUNICATION',
          label: 'Commercial Recruiter Using Yahoo Mail',
          severity: 'HIGH',
          description: 'Recruiting for an alleged company via personal Yahoo webmail.',
          evidenceSnippet: 'starlight.careers@yahoo.com'
        },
        {
          id: 'flag-urgent',
          category: 'URGENCY_PRESSURE',
          label: 'Artificial 24-Hour Pressure',
          severity: 'MEDIUM',
          description: 'High-pressure deadline designed to prevent student from conducting due diligence.',
          evidenceSnippet: 'confirm your acceptance within 24 hours'
        },
        {
          id: 'flag-pii',
          category: 'SENSITIVE_DATA_HARVESTING',
          label: 'Premature Identity Document Request',
          severity: 'HIGH',
          description: 'Demanding unredacted national ID and utility bill before any formal interview or signed contract.',
          evidenceSnippet: 'sending scanned copies of your national identity card and utility bill'
        }
      ]),
      recommendations_json: JSON.stringify([
        'Do not send sensitive identity documents (national ID, passport, utility bills) to free email addresses.',
        'Request an official corporate email address and verified physical headquarters address.',
        'Verify company registration on official business registries or LinkedIn company directory.'
      ]),
      model_verdict_json: JSON.stringify({
        category: 'Suspicious',
        confidenceScore: 65,
        verdictRationale: 'Signs of identity harvesting or advance equipment check scam using artificial deadline pressure.',
        engine: 'Gemini 3.8 Flash'
      }),
      is_starred: 1
    }
  ];

  for (const item of samples) {
    database.run(
      `INSERT INTO analysis_records (
        id, timestamp, job_title, company_name, sender_info, channel,
        risk_category, risk_score, heuristic_score, model_score, summary,
        raw_text, flags_json, recommendations_json, model_verdict_json, is_starred
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.timestamp,
        item.job_title,
        item.company_name,
        item.sender_info,
        item.channel,
        item.risk_category,
        item.risk_score,
        item.heuristic_score,
        item.model_score,
        item.summary,
        item.raw_text,
        item.flags_json,
        item.recommendations_json,
        item.model_verdict_json,
        item.is_starred
      ]
    );
  }
}

export function insertRecord(record: AnalysisRecord): void {
  if (!db) throw new Error('Database not initialized');
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
}

export function getRecords(search?: string, category?: string): AnalysisRecord[] {
  if (!db) throw new Error('Database not initialized');

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
}

export function getRecordById(id: string): AnalysisRecord | null {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare('SELECT * FROM analysis_records WHERE id = ?');
  stmt.bind([id]);
  let record: AnalysisRecord | null = null;
  if (stmt.step()) {
    record = stmt.getAsObject() as any;
  }
  stmt.free();
  return record;
}

export function deleteRecord(id: string): boolean {
  if (!db) throw new Error('Database not initialized');
  db.run('DELETE FROM analysis_records WHERE id = ?', [id]);
  saveDb();
  return true;
}

export function toggleStar(id: string): boolean {
  if (!db) throw new Error('Database not initialized');
  db.run('UPDATE analysis_records SET is_starred = CASE WHEN is_starred = 1 THEN 0 ELSE 1 END WHERE id = ?', [id]);
  saveDb();
  return true;
}

export function getDatabaseStats() {
  if (!db) throw new Error('Database not initialized');

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
}
