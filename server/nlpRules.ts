export interface FlaggedIndicator {
  id: string;
  category: 'FEE_DEMAND' | 'COMPENSATION_ANOMALY' | 'URGENCY_PRESSURE' | 'SUSPICIOUS_COMMUNICATION' | 'SENSITIVE_DATA_HARVESTING' | 'INTERVIEW_OMISSION' | 'SUSPICIOUS_PAYMENT_METHODS' | 'LEXICAL_ANOMALIES';
  label: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  evidenceSnippet: string;
  matchedKeywords: string[];
}

export interface HeuristicAnalysisResult {
  heuristicScore: number; // 0 to 100
  riskCategory: 'Genuine' | 'Suspicious' | 'Fraudulent';
  flags: FlaggedIndicator[];
  extractedEntities: {
    emails: string[];
    phones: string[];
    telegramHandles: string[];
    upiIds: string[];
    urls: string[];
    moneyMentions: string[];
  };
  recommendations: string[];
  heuristicSummary: string;
}

export function runHeuristicNLPAnalysis(text: string, metadata?: {
  companyName?: string;
  jobTitle?: string;
  senderInfo?: string;
  channel?: string;
}): HeuristicAnalysisResult {
  const flags: FlaggedIndicator[] = [];
  const fullTextWithMeta = `${metadata?.companyName || ''} ${metadata?.senderInfo || ''} ${metadata?.channel || ''} ${text}`.toLowerCase();

  // 1. Extract contact details and money mentions
  const emails = Array.from(new Set(text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []));
  const phones = Array.from(new Set(text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || []));
  const telegramHandles = Array.from(new Set(text.match(/@[a-zA-Z0-9_]{4,}/g) || []));
  const upiIds = Array.from(new Set(text.match(/[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g) || []))
    .filter(u => /@(okaxis|okhdfcbank|okicici|oksbi|paytm|ybl|apl|upi|axl|ibl)/i.test(u));
  const urls = Array.from(new Set(text.match(/https?:\/\/[^\s$.?#].[^\s]*/g) || []));
  const moneyMentions = Array.from(new Set(text.match(/(?:[$€£₹]|rs\.?|inr|usd)\s*\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:k|lakh|lakhs|crore|per\s*(?:day|week|month|hour|hr|year|annum)))?/gi) || []));

  // --- RULE 1: Demands for Upfront Fees or Deposits (CRITICAL) ---
  const feePatterns = [
    { regex: /registration\s*(?:fee|charge|amount|cost)/i, label: 'Asking for a Registration Fee' },
    { regex: /(?:security|refundable|caution)\s*(?:deposit|fee|bond|money|amount)/i, label: 'Asking for a "Refundable" Security Deposit' },
    { regex: /(?:training|kit|material|course)\s*(?:fee|cost|charge|payment)/i, label: 'Charging for Training or Starter Kits' },
    { regex: /(?:laptop|courier|dispatch|delivery|shipping)\s*(?:fee|charge|advance|cost)/i, label: 'Charging for Laptop Shipping or Courier' },
    { regex: /(?:processing|document|documentation|id\s*card|gate\s*pass)\s*(?:fee|charge)/i, label: 'Charging for ID Cards or Document Processing' },
    { regex: /(?:pay|send|transfer|deposit)\s*(?:rs\.?|₹|\$|\€|\£)?\s*\d+\s*(?:before|prior|for|to\s*confirm|advance)/i, label: 'Demanding Advance Money to Start Work' }
  ];

  feePatterns.forEach((item, idx) => {
    const match = item.regex.exec(text);
    if (match) {
      flags.push({
        id: `fee-${idx}`,
        category: 'FEE_DEMAND',
        label: item.label,
        severity: 'CRITICAL',
        description: 'Real companies never ask job applicants or interns to pay any fee for applying, receiving equipment, or starting work.',
        evidenceSnippet: extractSnippet(text, match.index, match[0].length),
        matchedKeywords: [match[0]]
      });
    }
  });

  // --- RULE 2: Suspicious Payment Methods (Crypto, Gift Cards, Personal UPI) ---
  const paymentChannelPatterns = [
    { regex: /(?:crypto|usdt|bitcoin|btc|eth|binance|trust\s*wallet)/i, label: 'Asking for Cryptocurrency or Digital Tokens' },
    { regex: /(?:gift\s*card|itunes|steam\s*card|google\s*play\s*card|amazon\s*gift)/i, label: 'Asking for Gift Cards' },
    { regex: /(?:cashier'?s\s*check|money\s*order|wire\s*transfer|western\s*union)/i, label: 'Unusual Wire Transfer or Check Instructions' },
    { regex: /(?:pay\s*via|send\s*to)\s*upi/i, label: 'Asking to Send Money to a Personal UPI Address' }
  ];

  paymentChannelPatterns.forEach((item, idx) => {
    const match = item.regex.exec(text);
    if (match) {
      flags.push({
        id: `pay-chan-${idx}`,
        category: 'SUSPICIOUS_PAYMENT_METHODS',
        label: item.label,
        severity: 'CRITICAL',
        description: 'Asking for payments through apps, cryptocurrency, or gift cards is a strong warning sign of a scam.',
        evidenceSnippet: extractSnippet(text, match.index, match[0].length),
        matchedKeywords: [match[0]]
      });
    }
  });

  if (upiIds.length > 0 && flags.some(f => f.category === 'FEE_DEMAND')) {
    flags.push({
      id: 'upi-address-detected',
      category: 'SUSPICIOUS_PAYMENT_METHODS',
      label: 'Personal Payment Address Found',
      severity: 'HIGH',
      description: `A personal payment address was found (${upiIds.join(', ')}). Real businesses do not collect application money into personal accounts.`,
      evidenceSnippet: upiIds[0],
      matchedKeywords: upiIds
    });
  }

  // --- RULE 3: Unrealistic Salary Promises & Easy Money ---
  const compensationAnomalies = [
    { regex: /(?:earn|make|salary|income|pay)\s*(?:up\s*to\s*)?(?:rs\.?|₹|\$)\s*(?:[3-9]\d{4}|\d{6,})\s*(?:per\s*(?:day|week|daily)|daily)/i, label: 'Unusually High Daily or Weekly Pay' },
    { regex: /(?:like\s*(?:and|&)\s*subscribe|youtube\s*videos?|rating\s*products?|hotel\s*reviews?|data\s*entry|copy\s*paste|ad\s*clicking)\s*(?:earn|job|task)/i, label: 'Paying High Money for Liking Videos or Simple Tasks' },
    { regex: /(?:1-2\s*hours?|30\s*mins?|few\s*minutes?)\s*(?:daily|work)\s*(?:earn|make)\s*(?:rs\.?|₹|\$)\s*[0-9]+/i, label: 'Big Money Promised for Very Little Time' },
    { regex: /(?:guaranteed|fixed)\s*(?:daily|instant)\s*(?:profit|income|return|stipend)/i, label: 'Guaranteed Instant Returns or Profit' }
  ];

  compensationAnomalies.forEach((item, idx) => {
    const match = item.regex.exec(text);
    if (match) {
      flags.push({
        id: `comp-${idx}`,
        category: 'COMPENSATION_ANOMALY',
        label: item.label,
        severity: 'HIGH',
        description: 'Offers that promise high daily earnings for very simple tasks (like watching videos or typing) are almost always traps.',
        evidenceSnippet: extractSnippet(text, match.index, match[0].length),
        matchedKeywords: [match[0]]
      });
    }
  });

  // --- RULE 4: Email Address and Contact Warnings ---
  const freeEmailProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediffmail.com', 'zoho.com', 'aol.com', 'protonmail.com'];
  const wellKnownEnterprises = ['google', 'microsoft', 'amazon', 'apple', 'infosys', 'tcs', 'wipro', 'deloitte', 'accenture', 'meta', 'netflix', 'goldman', 'morgan stanley', 'cognizant', 'ibm', 'oracle'];
  
  let mncClaimed: string | null = null;
  for (const mnc of wellKnownEnterprises) {
    if (fullTextWithMeta.includes(mnc)) {
      mncClaimed = mnc;
      break;
    }
  }

  emails.forEach(email => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && freeEmailProviders.includes(domain)) {
      if (mncClaimed) {
        flags.push({
          id: `impersonation-${domain}`,
          category: 'SUSPICIOUS_COMMUNICATION',
          label: `Claims to Be ${mncClaimed.toUpperCase()} but Uses a Free Email`,
          severity: 'CRITICAL',
          description: `The message mentions ${mncClaimed.toUpperCase()}, but the contact email uses a free service (@${domain}) instead of their real company address.`,
          evidenceSnippet: email,
          matchedKeywords: [email, mncClaimed]
        });
      } else {
        flags.push({
          id: `free-webmail-${domain}`,
          category: 'SUSPICIOUS_COMMUNICATION',
          label: 'Official Hiring Done Through a Free Email Account',
          severity: 'HIGH',
          description: `The sender uses a free personal email (@${domain}). Professional recruiters almost always use their company's official domain name.`,
          evidenceSnippet: email,
          matchedKeywords: [email]
        });
      }
    }
  });

  const telegramPatterns = [
    /(?:telegram|contact\s*on\s*telegram|tg\s*handle|@\w+_hr|t\.me\/[a-zA-Z0-9_]+)/i,
    /(?:whatsapp\s*(?:only|hr|manager|group)|wa\.me\/[0-9]+)/i
  ];

  telegramPatterns.forEach((rgx, idx) => {
    const match = rgx.exec(text);
    if (match) {
      flags.push({
        id: `tele-redirect-${idx}`,
        category: 'SUSPICIOUS_COMMUNICATION',
        label: 'Recruiting Strictly on Telegram or WhatsApp',
        severity: 'HIGH',
        description: 'Scammers frequently keep conversations on chat apps like Telegram or WhatsApp to remain anonymous.',
        evidenceSnippet: extractSnippet(text, match.index, match[0].length),
        matchedKeywords: [match[0]]
      });
    }
  });

  // --- RULE 5: No Interview or Immediate Selection ---
  const noInterviewPatterns = [
    /(?:no\s*interview\s*(?:needed|required|conducted)|direct\s*(?:joining|selection|hiring)|instant\s*offer\s*letter)/i,
    /(?:selected\s*without\s*interview|congratulations\s*you\s*are\s*directly\s*selected)/i,
    /(?:interview\s*via\s*telegram|questionnaire\s*only\s*interview)/i
  ];

  noInterviewPatterns.forEach((rgx, idx) => {
    const match = rgx.exec(text);
    if (match) {
      flags.push({
        id: `no-interview-${idx}`,
        category: 'INTERVIEW_OMISSION',
        label: 'Selected Instantly Without an Interview',
        severity: 'HIGH',
        description: 'Real jobs and internships always have at least one interview or skill check before giving you an offer.',
        evidenceSnippet: extractSnippet(text, match.index, match[0].length),
        matchedKeywords: [match[0]]
      });
    }
  });

  // --- RULE 6: Asking for Private Information Too Early ---
  const piiPatterns = [
    { regex: /(?:bank\s*account\s*password|net\s*banking|atm\s*pin|cvv\s*number|otp)/i, label: 'Asking for Banking Passwords, PIN, or OTP', severity: 'CRITICAL' as const },
    { regex: /(?:blank\s*signed\s*cheque|blank\s*check|send\s*original\s*(?:degree|certificate|passport|mark\s*sheet))/i, label: 'Asking for Blank Signed Checks or Original Certificates', severity: 'CRITICAL' as const },
    { regex: /(?:credit\s*card\s*number|debit\s*card\s*details|card\s*expiry)/i, label: 'Asking for Card Numbers or Security Codes', severity: 'CRITICAL' as const },
    { regex: /(?:aadhaar|ssn|social\s*security\s*number|pan\s*card|id\s*photo)\s*(?:immediately|before\s*interview|to\s*apply)/i, label: 'Demanding Identity Card Photos Upfront', severity: 'MEDIUM' as const }
  ];

  piiPatterns.forEach((item, idx) => {
    const match = item.regex.exec(text);
    if (match) {
      flags.push({
        id: `pii-${idx}`,
        category: 'SENSITIVE_DATA_HARVESTING',
        label: item.label,
        severity: item.severity,
        description: 'Employers do not need banking passwords, PINs, OTPs, or original certificates before you are even hired.',
        evidenceSnippet: extractSnippet(text, match.index, match[0].length),
        matchedKeywords: [match[0]]
      });
    }
  });

  // --- RULE 7: Artificial Rush and Urgency ---
  const urgencyPatterns = [
    /(?:within\s*(?:1|2|3|6|12|24)\s*hours?|offer\s*expires\s*tonight|valid\s*only\s*today)/i,
    /(?:limited\s*(?:seats|slots|vacancies)\s*hurry|immediate\s*joiners\s*only\s*apply\s*now)/i,
    /(?:pay\s*immediately\s*or\s*lose\s*offer|slot\s*will\s*be\s*given\s*to\s*another)/i
  ];

  urgencyPatterns.forEach((rgx, idx) => {
    const match = rgx.exec(text);
    if (match) {
      flags.push({
        id: `urgency-${idx}`,
        category: 'URGENCY_PRESSURE',
        label: 'Rushing You with an Urgent Deadline',
        severity: 'MEDIUM',
        description: 'Scammers create tight deadlines (like "expires in 2 hours") so students act quickly without checking with parents or teachers.',
        evidenceSnippet: extractSnippet(text, match.index, match[0].length),
        matchedKeywords: [match[0]]
      });
    }
  });

  // --- RULE 8: Text Quality and Shouting ---
  const upperCaseRatio = (text.replace(/[^A-Z]/g, '').length) / Math.max(text.replace(/[^a-zA-Z]/g, '').length, 1);
  const exclamationCount = (text.match(/!/g) || []).length;

  if (upperCaseRatio > 0.45 && text.length > 80) {
    flags.push({
      id: 'lexical-caps',
      category: 'LEXICAL_ANOMALIES',
      label: 'Too Much Capital Letter Shouting',
      severity: 'LOW',
      description: 'The message is written in all-capital letters, which is common in spam messages and unusual for professional companies.',
      evidenceSnippet: text.slice(0, 80) + '...',
      matchedKeywords: ['ALL-CAPS text']
    });
  }

  if (exclamationCount >= 5 && text.length < 500) {
    flags.push({
      id: 'lexical-exclamation',
      category: 'LEXICAL_ANOMALIES',
      label: 'Too Many Exclamation Marks',
      severity: 'LOW',
      description: 'Multiple exclamation points (!!!) often indicate spam rather than official company communication.',
      evidenceSnippet: `Contains ${exclamationCount} exclamation marks`,
      matchedKeywords: ['!']
    });
  }

  // Calculate score
  let score = 0;
  for (const flag of flags) {
    switch (flag.severity) {
      case 'CRITICAL':
        score += 35;
        break;
      case 'HIGH':
        score += 22;
        break;
      case 'MEDIUM':
        score += 12;
        break;
      case 'LOW':
        score += 5;
        break;
    }
  }

  score = Math.min(Math.max(score, 0), 98);

  const antiScamDisclaimers = [
    /(?:never\s*ask(?:s)?\s*for\s*(?:money|fee|deposit|payment))/i,
    /(?:we\s*do\s*not\s*charge\s*any\s*(?:fee|money))/i,
    /(?:no\s*fee\s*is\s*required\s*at\s*any\s*stage)/i
  ];

  const hasAntiScamDisclaimer = antiScamDisclaimers.some(rgx => rgx.test(text));
  if (hasAntiScamDisclaimer && flags.length === 0) {
    score = 5;
  } else if (hasAntiScamDisclaimer && flags.length > 0) {
    if (!flags.some(f => f.category === 'SUSPICIOUS_PAYMENT_METHODS')) {
      score = Math.max(score - 20, 5);
    }
  }

  let riskCategory: 'Genuine' | 'Suspicious' | 'Fraudulent' = 'Genuine';
  if (score >= 70 || flags.some(f => f.severity === 'CRITICAL')) {
    riskCategory = 'Fraudulent';
    score = Math.max(score, 75);
  } else if (score >= 30) {
    riskCategory = 'Suspicious';
  } else {
    riskCategory = 'Genuine';
    score = Math.min(score, 25);
  }

  const recommendations: string[] = [];
  if (flags.some(f => f.category === 'FEE_DEMAND' || f.category === 'SUSPICIOUS_PAYMENT_METHODS')) {
    recommendations.push('Do NOT pay any money, whether called a registration fee, laptop deposit, or training kit fee. Real employers pay you; you never pay them.');
    recommendations.push('If you already paid, immediately call the National Cyber Crime Helpline at 1930 or visit cybercrime.gov.in.');
  }

  if (flags.some(f => f.category === 'SUSPICIOUS_COMMUNICATION')) {
    recommendations.push('Never agree to a job offer that only happens over Telegram, WhatsApp, or personal email. Ask for an official offer letter from their verified company email address.');
    recommendations.push('Visit the company\'s official website by typing the address yourself and check their careers page.');
  }

  if (flags.some(f => f.category === 'SENSITIVE_DATA_HARVESTING')) {
    recommendations.push('Never share your banking password, ATM PIN, card CVV, or one-time password (OTP). No legitimate employer will ever ask for these.');
  }

  if (flags.some(f => f.category === 'INTERVIEW_OMISSION')) {
    recommendations.push('Be cautious if you are offered a job immediately without any conversation or test. Real employers always interview you first.');
  }

  if (riskCategory === 'Genuine') {
    recommendations.push('This message looks normal and professional. To be safe, always double-check through the company\'s official careers page before sharing documents.');
    recommendations.push('You can also show this offer to your college placement cell to verify it.');
  } else {
    recommendations.push('Warn your classmates and friends so they don\'t fall for this same message.');
  }

  const heuristicSummary = flags.length === 0
    ? 'No common warning signs were detected in this advertisement. The wording looks like normal, professional recruitment.'
    : `We found ${flags.length} warning signs (${flags.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').length} important ones). Please review the warning signs below before responding.`;

  return {
    heuristicScore: score,
    riskCategory,
    flags,
    extractedEntities: {
      emails,
      phones,
      telegramHandles,
      upiIds,
      urls,
      moneyMentions
    },
    recommendations,
    heuristicSummary
  };
}

function extractSnippet(text: string, index: number, matchLength: number): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + matchLength + 40);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}
