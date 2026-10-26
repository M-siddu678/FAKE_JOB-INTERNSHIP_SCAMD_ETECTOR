import { initDb, insertRecord, AnalysisRecord } from '../server/db.js';
import { runHeuristicNLPAnalysis } from '../server/nlpRules.js';
import { runAIModelClassification } from '../server/aiClassifier.js';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // use as is
      }
    }

    const { text, companyName, jobTitle, senderInfo, channel } = body || {};

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

    // 2. Run AI model classification
    const aiResult = await runAIModelClassification(text, metadata);

    // 3. Synthesize verdict
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

    const recommendations = [...heuristicResult.recommendations];
    if (aiResult.isAvailable && aiResult.recommendedAction && !recommendations.includes(aiResult.recommendedAction)) {
      recommendations.unshift(aiResult.recommendedAction);
    }

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

    try {
      await initDb();
      insertRecord(newRecord);
    } catch (dbErr) {
      console.warn('Could not persist to SQLite, returning in-memory result:', dbErr);
    }

    return res.status(200).json({
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
      metadata
    });
  } catch (err: any) {
    console.error('Error in /api/analyze serverless handler:', err);
    return res.status(500).json({
      error: 'Sorry, we couldn\'t check this advertisement right now. Please try again in a few moments.'
    });
  }
}
