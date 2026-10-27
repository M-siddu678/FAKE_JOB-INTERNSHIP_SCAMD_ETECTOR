import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, insertRecord, getRecords, getRecordById, deleteRecord, toggleStar, clearAllRecords, getDatabaseStats, AnalysisRecord } from './server/db.js';
import { runHeuristicNLPAnalysis } from './server/nlpRules.js';
import { runAIModelClassification } from './server/aiClassifier.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Initialize SQLite database
  await initDb();
  console.log('[System] Storage system initialized.');

  // System Status Endpoint (simple, non-jargon friendly response)
  app.get('/api/system-status', (req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
    res.json({
      status: 'operational',
      environment: process.env.NODE_ENV || 'development',
      database: {
        engine: 'Saved Information Storage',
        status: 'Ready',
        storage: 'data/scam_detection.db'
      },
      nlpEngine: {
        status: 'Active',
        rulesCount: 8,
        categories: [
          'Fee Demands',
          'Unrealistic Salaries',
          'Rushed Deadlines',
          'Suspicious Contact Methods',
          'Private Data Requests',
          'Missing Interview Steps',
          'Suspicious Payment Methods',
          'Unusual Text Formatting'
        ]
      },
      aiModel: {
        modelName: 'Detection System',
        keyConfigured: hasKey,
        mode: hasKey ? 'Smart Scam Detection Active' : 'Basic Rule Checker Active'
      }
    });
  });

  // Statistics
  app.get('/api/stats', (req, res) => {
    try {
      const stats = getDatabaseStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: 'Sorry, we could not load your saved statistics. Please try again.' });
    }
  });

  // History List
  app.get('/api/history', (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;
      const rawRecords = getRecords(search, category);

      const parsedRecords = rawRecords
        .filter(r => !String(r.id).startsWith('scan-demo-'))
        .map(r => ({
          ...r,
          flags: JSON.parse(r.flags_json || '[]'),
          recommendations: JSON.parse(r.recommendations_json || '[]'),
          model_verdict: r.model_verdict_json ? JSON.parse(r.model_verdict_json) : null
        }));

      res.json({ records: parsedRecords });
    } catch (err: any) {
      res.status(500).json({ error: 'Sorry, we could not load your check history. Please try again.' });
    }
  });

  // Save / Sync History Record
  app.post('/api/history', (req, res) => {
    try {
      const record = req.body?.record || req.body;
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

      res.json({ success: true, id: record.id });
    } catch (err: any) {
      res.status(500).json({ error: 'Sorry, we could not save this record.' });
    }
  });

  // History Single Record
  app.get('/api/history/:id', (req, res) => {
    try {
      const record = getRecordById(req.params.id);
      if (!record) {
        return res.status(404).json({ error: 'We could not find this saved record.' });
      }
      res.json({
        record: {
          ...record,
          flags: JSON.parse(record.flags_json || '[]'),
          recommendations: JSON.parse(record.recommendations_json || '[]'),
          model_verdict: record.model_verdict_json ? JSON.parse(record.model_verdict_json) : null
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Sorry, we could not open this record. Please try again.' });
    }
  });

  // Delete History Record (by query or clearAll)
  app.delete('/api/history', (req, res) => {
    try {
      if (req.query.clearAll === 'true') {
        clearAllRecords();
        return res.json({ success: true, message: 'All records cleared.' });
      }
      const id = (req.query.id as string) || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: 'Record ID is required for deletion.' });
      }
      deleteRecord(id);
      res.json({ success: true, message: 'Record deleted successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Sorry, we could not delete this record. Please try again.' });
    }
  });

  // Delete History Record by route parameter
  app.delete('/api/history/:id', (req, res) => {
    try {
      deleteRecord(req.params.id);
      res.json({ success: true, message: 'Record deleted successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Sorry, we could not delete this record. Please try again.' });
    }
  });

  // Toggle Star on Record
  app.patch('/api/history/:id/star', (req, res) => {
    try {
      toggleStar(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Sorry, we could not update this bookmark.' });
    }
  });

  // Export History (JSON or CSV)
  app.get('/api/export', (req, res) => {
    try {
      const format = req.query.format || 'json';
      const records = getRecords();

      if (format === 'csv') {
        const headers = ['ID', 'Date Checked', 'Job Title', 'Company', 'Where Received', 'Risk Level', 'Estimated Risk Score', 'Details'];
        const csvRows = [headers.join(',')];

        for (const r of records) {
          const friendlyRisk = r.risk_category === 'Fraudulent' ? 'High Risk' : r.risk_category === 'Suspicious' ? 'Needs Careful Checking' : 'Low Risk';
          const row = [
            `"${r.id}"`,
            `"${r.timestamp}"`,
            `"${(r.job_title || '').replace(/"/g, '""')}"`,
            `"${(r.company_name || '').replace(/"/g, '""')}"`,
            `"${(r.channel || '').replace(/"/g, '""')}"`,
            `"${friendlyRisk}"`,
            r.risk_score,
            `"${(r.summary || '').replace(/"/g, '""')}"`
          ];
          csvRows.push(row.join(','));
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="job_checks_summary.csv"');
        return res.send(csvRows.join('\n'));
      }

      const fullData = records.map(r => ({
        ...r,
        flags: JSON.parse(r.flags_json || '[]'),
        recommendations: JSON.parse(r.recommendations_json || '[]'),
        model_verdict: r.model_verdict_json ? JSON.parse(r.model_verdict_json) : null
      }));

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="job_checks_summary.json"');
      res.json(fullData);
    } catch (err: any) {
      res.status(500).json({ error: 'Sorry, we could not export your records. Please try again.' });
    }
  });

  // Main Check Endpoint
  app.post('/api/analyze', async (req, res) => {
    try {
      const { text, companyName, jobTitle, senderInfo, channel } = req.body;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Please paste a job advertisement before continuing.' });
      }

      if (text.trim().length < 20) {
        return res.status(400).json({ error: 'The advertisement text is a bit too short. Please paste at least a couple of sentences (minimum 20 letters) so we can check it.' });
      }

      const metadata = {
        companyName: companyName ? String(companyName).trim() : undefined,
        jobTitle: jobTitle ? String(jobTitle).trim() : undefined,
        senderInfo: senderInfo ? String(senderInfo).trim() : undefined,
        channel: channel ? String(channel).trim() : undefined
      };

      // 1. Run rule-based checks
      const heuristicResult = runHeuristicNLPAnalysis(text, metadata);

      // 2. Run smart deception checks
      const aiResult = await runAIModelClassification(text, metadata);

      // 3. Combine results in simple English
      let finalScore: number;
      let finalCategory: 'Genuine' | 'Suspicious' | 'Fraudulent';
      let finalSummary: string;

      if (aiResult.isAvailable && typeof aiResult.confidenceScore === 'number') {
        let weighted = Math.round(heuristicResult.heuristicScore * 0.5 + aiResult.confidenceScore * 0.5);

        if (heuristicResult.flags.some(f => f.severity === 'CRITICAL')) {
          weighted = Math.max(weighted, 80);
        }

        finalScore = Math.min(Math.max(weighted, 0), 100);

        if (finalScore >= 70 || heuristicResult.flags.some(f => f.severity === 'CRITICAL') || aiResult.category === 'Fraudulent') {
          finalCategory = 'Fraudulent';
          finalSummary = 'High Risk: This job offer contains serious warning signs commonly seen in scams, such as asking for money or promising unrealistic pay. We strongly advise against paying anything or sharing personal details.';
        } else if (finalScore >= 35 || aiResult.category === 'Suspicious') {
          finalCategory = 'Suspicious';
          finalSummary = 'Needs Careful Checking: This offer has several unusual or unverified details. Please verify the employer through their official website or college placement office before taking the next step.';
        } else {
          finalCategory = 'Genuine';
          finalSummary = 'Low Risk: We did not find common scam warning signs. This looks like a standard recruitment message. As a general rule, always confirm offers on the company\'s official website.';
        }
      } else {
        finalScore = heuristicResult.heuristicScore;
        finalCategory = heuristicResult.riskCategory;

        if (finalCategory === 'Fraudulent') {
          finalSummary = 'High Risk: We found serious warning signs in this advertisement (such as requests for fees or suspicious contact methods). Never send money to secure a job.';
        } else if (finalCategory === 'Suspicious') {
          finalSummary = 'Needs Careful Checking: Some details look unusual or unverified. Please take extra care and verify the sender before sharing private details.';
        } else {
          finalSummary = 'Low Risk: No common scam warning signs were found in this text. It looks like standard, professional communication.';
        }
      }

      // Combine simple recommendations
      const recommendations = [...heuristicResult.recommendations];
      if (aiResult.isAvailable && aiResult.recommendedAction && !recommendations.includes(aiResult.recommendedAction)) {
        recommendations.unshift(aiResult.recommendedAction);
      }

      // Save to SQLite
      const recordId = `check-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const timestamp = new Date().toISOString();

      const newRecord: AnalysisRecord = {
        id: recordId,
        timestamp,
        job_title: metadata.jobTitle || 'Job / Internship Offer',
        company_name: metadata.companyName || (heuristicResult.extractedEntities.emails[0] ? `From: ${heuristicResult.extractedEntities.emails[0]}` : 'Unspecified Company'),
        sender_info: metadata.senderInfo || heuristicResult.extractedEntities.emails.join(', ') || 'Direct message',
        channel: metadata.channel || 'Direct Message',
        risk_category: finalCategory,
        risk_score: finalScore,
        heuristic_score: heuristicResult.heuristicScore,
        model_score: aiResult.isAvailable ? aiResult.confidenceScore ?? null : null,
        summary: finalSummary,
        raw_text: text,
        flags_json: JSON.stringify(heuristicResult.flags),
        recommendations_json: JSON.stringify(recommendations),
        model_verdict_json: aiResult.isAvailable ? JSON.stringify(aiResult) : null,
        is_starred: finalCategory === 'Fraudulent' ? 1 : 0
      };

      insertRecord(newRecord);

      res.json({
        recordId,
        timestamp,
        finalVerdict: {
          riskCategory: finalCategory,
          riskScore: finalScore,
          summary: finalSummary,
          recommendations
        },
        heuristicEngine: {
          score: heuristicResult.heuristicScore,
          riskCategory: heuristicResult.riskCategory,
          flags: heuristicResult.flags,
          extractedEntities: heuristicResult.extractedEntities,
          heuristicSummary: heuristicResult.heuristicSummary
        },
        aiModelEngine: aiResult,
        metadata,
        raw_text: text
      });
    } catch (err: any) {
      console.error('Error during check:', err);
      res.status(500).json({ error: 'Sorry, we couldn\'t check this advertisement right now. Please try again in a few moments.' });
    }
  });

  // Setup Vite in Dev or Static files in Production
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Scam Checker] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
