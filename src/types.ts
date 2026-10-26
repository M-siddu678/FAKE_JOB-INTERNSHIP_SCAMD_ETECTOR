export interface FlaggedIndicator {
  id: string;
  category: 'FEE_DEMAND' | 'COMPENSATION_ANOMALY' | 'URGENCY_PRESSURE' | 'SUSPICIOUS_COMMUNICATION' | 'SENSITIVE_DATA_HARVESTING' | 'INTERVIEW_OMISSION' | 'SUSPICIOUS_PAYMENT_METHODS' | 'LEXICAL_ANOMALIES';
  label: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  evidenceSnippet: string;
  matchedKeywords: string[];
}

export interface ExtractedEntities {
  emails: string[];
  phones: string[];
  telegramHandles: string[];
  upiIds: string[];
  urls: string[];
  moneyMentions: string[];
}

export interface AIModelResult {
  isAvailable: boolean;
  modelName: string;
  category?: 'Genuine' | 'Suspicious' | 'Fraudulent';
  confidenceScore?: number;
  semanticAnalysis?: string;
  linguisticObservations?: string[];
  identifiedRedFlags?: string[];
  verdictRationale?: string;
  recommendedAction?: string;
  note?: string;
}

export interface AnalysisResponse {
  recordId: string;
  timestamp: string;
  finalVerdict: {
    riskCategory: 'Genuine' | 'Suspicious' | 'Fraudulent';
    riskScore: number;
    summary: string;
    recommendations: string[];
  };
  heuristicEngine: {
    score: number;
    riskCategory: 'Genuine' | 'Suspicious' | 'Fraudulent';
    flags: FlaggedIndicator[];
    extractedEntities: ExtractedEntities;
    heuristicSummary: string;
  };
  aiModelEngine: AIModelResult;
  metadata: {
    companyName?: string;
    jobTitle?: string;
    senderInfo?: string;
    channel?: string;
  };
}

export interface AnalysisRecordItem {
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
  flags: FlaggedIndicator[];
  recommendations: string[];
  model_verdict: AIModelResult | null;
  is_starred: number;
}

export interface SystemStatus {
  status: string;
  environment: string;
  database: {
    engine: string;
    status: string;
    storage: string;
  };
  nlpEngine: {
    status: string;
    rulesCount: number;
    categories: string[];
  };
  aiModel: {
    modelName: string;
    keyConfigured: boolean;
    mode: string;
  };
}

export interface DatabaseStats {
  totalScans: number;
  categoryCounts: {
    Genuine: number;
    Suspicious: number;
    Fraudulent: number;
  };
  avgRiskScore: number;
}
