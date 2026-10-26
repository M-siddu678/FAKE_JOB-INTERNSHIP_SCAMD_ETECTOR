export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  return res.status(200).json({
    status: 'operational',
    environment: process.env.VERCEL ? 'vercel' : (process.env.NODE_ENV || 'development'),
    database: {
      engine: 'Saved Information Storage',
      status: 'Ready',
      storage: process.env.VERCEL ? '/tmp/data' : 'data/scam_detection.db'
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
}
