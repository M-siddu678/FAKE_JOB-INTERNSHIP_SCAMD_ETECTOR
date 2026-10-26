import { AnalysisResponse, AnalysisRecordItem, FlaggedIndicator, DatabaseStats } from '../types';
import { runHeuristicNLPAnalysis } from '../../server/nlpRules';

const LOCAL_STORAGE_KEY = 'scam_checker_records_v1';

// Helper to safely parse JSON from a fetch response without crashing on HTML error pages
export async function safeFetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; data?: T; error?: string; isHtmlOrText?: boolean }> {
  try {
    const res = await fetch(url, options);
    const contentType = (res.headers.get('content-type') || '').toLowerCase();

    // Check if the response is actually JSON
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        return {
          ok: false,
          error: data?.error || 'Service temporarily unavailable.',
          isHtmlOrText: false
        };
      }
      return { ok: true, data, isHtmlOrText: false };
    }

    // It is an HTML or text error page (such as Vercel's "The page could not be found" 404)
    const textSnippet = (await res.text()).trim();
    console.warn(`[SafeFetch] ${url} returned non-JSON (${res.status}): ${textSnippet.slice(0, 120)}`);

    return {
      ok: false,
      error: res.status === 404
        ? 'The detection server endpoint was not found (404).'
        : 'Service temporarily unavailable.',
      isHtmlOrText: true
    };
  } catch (err: any) {
    console.warn(`[SafeFetch] Network error for ${url}:`, err);
    return {
      ok: false,
      error: 'Network connection issue or offline mode.',
      isHtmlOrText: false
    };
  }
}

// Client-side rule analysis fallback (runs 100% in browser with no API key or server required)
export function runClientSideAnalysis(payload: {
  text: string;
  companyName?: string;
  jobTitle?: string;
  senderInfo?: string;
  channel?: string;
}): AnalysisResponse {
  const { text, companyName, jobTitle, senderInfo, channel } = payload;
  const metadata = { companyName, jobTitle, senderInfo, channel };

  const heuristicResult = runHeuristicNLPAnalysis(text, metadata);
  const finalCategory = heuristicResult.riskCategory;
  const finalScore = heuristicResult.heuristicScore;

  let finalSummary: string;
  if (finalCategory === 'Fraudulent') {
    finalSummary = 'High Risk: We found serious warning signs in this advertisement (such as requests for fees or suspicious contact methods). Never send money to secure a job.';
  } else if (finalCategory === 'Suspicious') {
    finalSummary = 'Needs Careful Checking: Some details look unusual or unverified. Please take extra care and verify the sender before sharing private details.';
  } else {
    finalSummary = 'Low Risk: No common scam warning signs were found in this text. It looks like standard, professional communication.';
  }

  const recordId = `check-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  const response: AnalysisResponse = {
    recordId,
    timestamp,
    finalVerdict: {
      riskCategory: finalCategory,
      riskScore: finalScore,
      summary: finalSummary,
      recommendations: heuristicResult.recommendations
    },
    heuristicEngine: {
      score: heuristicResult.heuristicScore,
      riskCategory: heuristicResult.riskCategory,
      flags: heuristicResult.flags,
      extractedEntities: heuristicResult.extractedEntities,
      heuristicSummary: heuristicResult.heuristicSummary
    },
    aiModelEngine: {
      isAvailable: false,
      modelName: 'Built-in Rule Checker',
      note: 'Checked using built-in scam detection rules.'
    },
    metadata
  };

  // Save to local storage as fallback
  saveRecordToLocalStorage({
    id: recordId,
    timestamp,
    job_title: jobTitle || 'Job / Internship Offer',
    company_name: companyName || (heuristicResult.extractedEntities.emails[0] ? `From: ${heuristicResult.extractedEntities.emails[0]}` : 'Unspecified Company'),
    sender_info: senderInfo || heuristicResult.extractedEntities.emails.join(', ') || 'Direct message',
    channel: channel || 'Direct Message',
    risk_category: finalCategory,
    risk_score: finalScore,
    heuristic_score: heuristicResult.heuristicScore,
    model_score: null,
    summary: finalSummary,
    raw_text: text,
    flags: heuristicResult.flags,
    recommendations: heuristicResult.recommendations,
    model_verdict: null,
    is_starred: finalCategory === 'Fraudulent' ? 1 : 0
  });

  return response;
}

// LocalStorage helpers for offline or static hosting
export function getLocalStorageRecords(): AnalysisRecordItem[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveRecordToLocalStorage(record: AnalysisRecordItem): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const existing = getLocalStorageRecords();
    const updated = [record, ...existing.filter((r) => r.id !== record.id)].slice(0, 50);
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
}

export function deleteLocalStorageRecord(id: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const existing = getLocalStorageRecords();
    const updated = existing.filter((r) => r.id !== id);
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not delete from localStorage:', e);
  }
}

export function toggleLocalStorageStar(id: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const existing = getLocalStorageRecords();
    const updated = existing.map((r) =>
      r.id === id ? { ...r, is_starred: r.is_starred ? 0 : 1 } : r
    );
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not update bookmark in localStorage:', e);
  }
}

export function computeLocalStats(records: AnalysisRecordItem[]): DatabaseStats {
  const counts = { Genuine: 0, Suspicious: 0, Fraudulent: 0 };
  let totalScore = 0;

  records.forEach((r) => {
    if (counts[r.risk_category] !== undefined) {
      counts[r.risk_category]++;
    }
    totalScore += r.risk_score || 0;
  });

  return {
    totalScans: records.length,
    categoryCounts: counts,
    avgRiskScore: records.length > 0 ? Math.round(totalScore / records.length) : 0
  };
}
