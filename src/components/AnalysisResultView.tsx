import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Copy, 
  Check, 
  Printer, 
  Bookmark, 
  Building2, 
  Briefcase, 
  Mail, 
  Radio, 
  Lock,
  ExternalLink,
  Info
} from 'lucide-react';
import { AnalysisResponse, FlaggedIndicator } from '../types';

interface AnalysisResultViewProps {
  result: AnalysisResponse;
  onOpenReport: () => void;
  onReset: () => void;
  onToggleStar?: (id: string) => void;
  isStarred?: boolean;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  result,
  onOpenReport,
  onReset,
  onToggleStar,
  isStarred
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const { finalVerdict, heuristicEngine, metadata, recordId, timestamp } = result;

  // Map internal categories to simple user-friendly labels
  const riskCategory = finalVerdict.riskCategory;
  const isHighRisk = riskCategory === 'Fraudulent';
  const isNeedsChecking = riskCategory === 'Suspicious';
  const isLowRisk = riskCategory === 'Genuine';

  const friendlyRiskLabel = isHighRisk 
    ? 'High Risk' 
    : isNeedsChecking 
    ? 'Needs Careful Checking' 
    : 'Low Risk';

  const friendlyRiskExplanation = isHighRisk
    ? 'Contains major warning signs often seen in scams, such as asking for payment, promising unrealistic earnings, or refusing real interviews.'
    : isNeedsChecking
    ? 'Contains some unusual details such as personal email addresses, rush deadlines, or unverified claims. Double-check before responding.'
    : 'Looks like standard recruitment with typical company procedures and no fee requests.';

  const categoryTheme = isHighRisk
    ? {
        bg: 'bg-rose-950/20',
        border: 'border-rose-600/40',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        textColor: 'text-rose-400',
        barColor: 'bg-rose-500'
      }
    : isNeedsChecking
    ? {
        bg: 'bg-amber-950/20',
        border: 'border-amber-600/40',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        textColor: 'text-amber-400',
        barColor: 'bg-amber-500'
      }
    : {
        bg: 'bg-emerald-950/20',
        border: 'border-emerald-600/40',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        textColor: 'text-emerald-400',
        barColor: 'bg-emerald-500'
      };

  const hrEmailTemplate = `To: The Human Resources / Careers Department
Subject: Checking the authenticity of a job offer - [Your Name]

Dear Hiring Team,

I recently received a message regarding an employment opportunity for the position of "${metadata.jobTitle || 'Job / Internship'}".
The message came from: ${metadata.senderInfo || 'Recruiter'} through ${metadata.channel || 'Direct message'}.

Could you please confirm if this message was officially sent by your company?

Thank you for your time and help.
Sincerely,
[Your Full Name]
[Your Phone Number]`;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(hrEmailTemplate);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. YOUR RESULTS BANNER */}
      <div className={`rounded-2xl p-6 sm:p-8 border ${categoryTheme.border} ${categoryTheme.bg} shadow-xl relative`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isHighRisk ? 'bg-rose-500/20 text-rose-400' : isNeedsChecking ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
            } border ${categoryTheme.border}`}>
              {isHighRisk ? (
                <ShieldAlert className="w-8 h-8" />
              ) : isNeedsChecking ? (
                <AlertTriangle className="w-8 h-8" />
              ) : (
                <ShieldCheck className="w-8 h-8" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Your Results
                </span>
                <span className="text-slate-600">•</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${categoryTheme.badge}`}>
                  {friendlyRiskLabel}
                </span>
              </div>

              <h3 className="mt-1.5 text-2xl font-bold text-white tracking-tight">
                Risk Level: {friendlyRiskLabel}
              </h3>

              <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {friendlyRiskExplanation}
              </p>
            </div>
          </div>

          {/* Estimated Risk Score Dial */}
          <div className="bg-slate-900/95 rounded-2xl p-4 sm:p-5 border border-slate-800 flex-shrink-0 flex items-center justify-between lg:flex-col lg:justify-center text-center gap-3 min-w-[210px]">
            <div className="text-left lg:text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Estimated Risk Score
              </span>
              <span className={`text-3xl sm:text-4xl font-extrabold ${categoryTheme.textColor}`}>
                {finalVerdict.riskScore} <span className="text-sm font-normal text-slate-500">/ 100</span>
              </span>
            </div>

            <div className="w-32 lg:w-40">
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60">
                <div
                  className={`h-full ${categoryTheme.barColor} transition-all duration-700`}
                  style={{ width: `${Math.max(finalVerdict.riskScore, 5)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0 (Low)</span>
                <span>100 (High)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Note on score estimation */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
          <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>
            Please note: This score is an estimate based on detected warning signs, not absolute proof that an offer is genuine or fraudulent. Always verify employers yourself.
          </span>
        </div>

        {/* Toolbar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 text-xs">
            Checked on {new Date(timestamp).toLocaleDateString()} at {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          <div className="flex items-center gap-2">
            {onToggleStar && (
              <button
                type="button"
                onClick={() => onToggleStar(recordId)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  isStarred
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400' : ''}`} />
                <span>{isStarred ? 'Saved Bookmark' : 'Bookmark This'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print or Save Summary</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
            >
              Check Another Job
            </button>
          </div>
        </div>
      </div>

      {/* 2. JOB OFFER DETAILS */}
      <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          <span>Job Offer Details</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 block">Company Name:</span>
            <p className="font-semibold text-slate-200 mt-0.5 truncate">
              {metadata.companyName || 'Not specified in message'}
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 block">Job Role:</span>
            <p className="font-semibold text-slate-200 mt-0.5 truncate">
              {metadata.jobTitle || 'Not specified in message'}
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 block">Recruiter Contact:</span>
            <p className="font-semibold text-slate-200 mt-0.5 truncate">
              {metadata.senderInfo || (heuristicEngine.extractedEntities.emails[0] || 'Not specified')}
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 block">Where Received:</span>
            <p className="font-semibold text-slate-200 mt-0.5 truncate">
              {metadata.channel || 'Direct message'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. WARNING SIGNS FOUND */}
      <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Warning Signs Found ({heuristicEngine.flags.length})</span>
          </h4>
        </div>

        {heuristicEngine.flags.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-semibold">No common warning signs detected</p>
              <p className="text-emerald-400/80 text-[11px] mt-0.5">
                We did not find fee demands, suspicious payment requests, or free email addresses.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {heuristicEngine.flags.map((flag, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      flag.severity === 'CRITICAL' || flag.severity === 'HIGH'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {flag.severity === 'CRITICAL' || flag.severity === 'HIGH' ? 'Major Warning' : 'Notice'}
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-slate-200">
                      {flag.label}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {flag.description}
                </p>

                {flag.evidenceSnippet && (
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] text-amber-300 flex items-start gap-2">
                    <span className="text-slate-500 flex-shrink-0 font-medium">Found in text:</span>
                    <span className="italic break-words">"{flag.evidenceSnippet}"</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. WHY THIS OFFER MAY BE RISKY */}
      {heuristicEngine.flags.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span>Why This Offer May Be Risky</span>
          </h4>

          <div className="text-xs text-slate-300 leading-relaxed space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <p>
              Scammers often use fake job and internship offers to target college students and recent graduates.
              Here is why the warning signs above indicate potential danger:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li><strong>Real employers never ask you to pay money:</strong> Any request for a registration fee, laptop delivery charge, or training deposit is a major scam indicator.</li>
              <li><strong>High pay for simple work is a trap:</strong> Promises of ₹3,000–₹5,000/day for liking videos or typing are typically prepaid task traps where victims lose money.</li>
              <li><strong>Official hiring uses real company domains:</strong> Genuine recruiters use official company emails (like <code>careers@company.com</code>), not personal Gmail or Yahoo addresses.</li>
              <li><strong>Legitimate companies always interview you:</strong> Being hired immediately over WhatsApp or Telegram without an assessment or interview is abnormal.</li>
            </ul>
          </div>
        </div>
      )}

      {/* 5. WHAT YOU SHOULD DO NEXT */}
      <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>What You Should Do Next</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {finalVerdict.recommendations.map((rec, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5"
            >
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-slate-300 leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>

        {/* Ready-to-use verification template */}
        <div className="mt-4 p-4 rounded-xl bg-blue-950/30 border border-blue-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Template: How to Email the Real Company to Verify This Offer
            </span>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
            >
              {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedEmail ? 'Copied!' : 'Copy Template'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Find the company's real website yourself (do not click links in the message), look up their official careers contact email, and send this simple note:
          </p>
          <pre className="text-[11px] font-sans text-slate-300 bg-slate-950 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
            {hrEmailTemplate}
          </pre>
        </div>
      </div>
    </div>
  );
};
