import React from 'react';
import { Printer, X, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import { AnalysisResponse } from '../types';

interface ReportModalProps {
  result: AnalysisResponse;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ result, onClose }) => {
  const { finalVerdict, heuristicEngine, metadata, recordId, timestamp } = result;

  const handlePrint = () => {
    window.print();
  };

  const isHighRisk = finalVerdict.riskCategory === 'Fraudulent';
  const isNeedsChecking = finalVerdict.riskCategory === 'Suspicious';

  const friendlyRiskLabel = isHighRisk 
    ? 'High Risk' 
    : isNeedsChecking 
    ? 'Needs Careful Checking' 
    : 'Low Risk';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Controls (Hidden in print) */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between print:hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Printable Job Safety Summary
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="p-8 sm:p-10 space-y-6 bg-slate-950 text-slate-900 print:bg-white print:text-black">
          {/* Header */}
          <div className="border-b-2 border-slate-700 print:border-black pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white print:text-black">
                Job Offer Safety Summary
              </h1>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
                Verification Report • Fake Job &amp; Internship Scam Checker
              </p>
            </div>

            <div className="text-right text-[11px] text-slate-400 print:text-slate-600">
              <p>Reference: {recordId}</p>
              <p>Date: {new Date(timestamp).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Job Offer Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-500 block">
                Company Name
              </span>
              <p className="font-semibold text-white print:text-black mt-0.5">
                {metadata.companyName || 'Not specified'}
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-500 block">
                Job Role
              </span>
              <p className="font-semibold text-white print:text-black mt-0.5">
                {metadata.jobTitle || 'Not specified'}
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-500 block">
                Contact
              </span>
              <p className="font-semibold text-white print:text-black mt-0.5 truncate">
                {metadata.senderInfo || 'Direct Message'}
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-500 block">
                Where Received
              </span>
              <p className="font-semibold text-white print:text-black mt-0.5">
                {metadata.channel || 'Direct'}
              </p>
            </div>
          </div>

          {/* Risk Level & Score */}
          <div className={`p-5 rounded-xl border ${
            isHighRisk
              ? 'bg-rose-950/40 border-rose-800/80 text-rose-300 print:bg-red-50 print:border-red-400 print:text-red-900'
              : isNeedsChecking
              ? 'bg-amber-950/40 border-amber-800/80 text-amber-300 print:bg-amber-50 print:border-amber-400 print:text-amber-900'
              : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300 print:bg-emerald-50 print:border-emerald-400 print:text-emerald-900'
          } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
            <div>
              <div className="flex items-center gap-2">
                {isHighRisk ? (
                  <ShieldAlert className="w-6 h-6 text-rose-400 print:text-red-700" />
                ) : isNeedsChecking ? (
                  <AlertTriangle className="w-6 h-6 text-amber-400 print:text-amber-700" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-emerald-400 print:text-emerald-700" />
                )}
                <span className="text-lg font-bold tracking-tight uppercase">
                  Risk Level: {friendlyRiskLabel}
                </span>
              </div>
              <p className="text-xs mt-1 opacity-90 max-w-lg leading-relaxed">
                {finalVerdict.summary}
              </p>
            </div>

            <div className="text-right sm:border-l sm:border-slate-800 print:border-slate-300 sm:pl-5 flex-shrink-0">
              <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">
                Estimated Risk Score
              </span>
              <span className="text-3xl font-extrabold font-mono">
                {finalVerdict.riskScore} <span className="text-xs font-normal opacity-70">/ 100</span>
              </span>
            </div>
          </div>

          {/* Warning Signs */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-800 border-b border-slate-800 print:border-slate-300 pb-2">
              Warning Signs Found ({heuristicEngine.flags.length})
            </h3>

            {heuristicEngine.flags.length === 0 ? (
              <p className="text-xs text-slate-400 print:text-slate-600">
                No common scam warning signs were found in this advertisement.
              </p>
            ) : (
              <div className="space-y-2">
                {heuristicEngine.flags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-300 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white print:text-black">
                        {idx + 1}. {flag.label}
                      </span>
                    </div>
                    <p className="text-slate-400 print:text-slate-700 text-[11px]">
                      {flag.description}
                    </p>
                    {flag.evidenceSnippet && (
                      <p className="text-[11px] text-amber-300 print:text-amber-800 bg-slate-950 print:bg-white p-2 rounded border border-slate-800 print:border-slate-200 italic">
                        Found in text: "{flag.evidenceSnippet}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* What to do next */}
          <div className="space-y-2 border-t border-slate-800 print:border-slate-300 pt-4 text-xs">
            <h4 className="font-bold text-white print:text-black uppercase text-[11px] tracking-wider">
              What You Should Do Next:
            </h4>
            <ul className="list-disc list-inside text-slate-300 print:text-slate-700 space-y-1 text-[11px]">
              {finalVerdict.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>

          {/* Note */}
          <div className="pt-4 border-t border-slate-800 print:border-slate-400 text-[10px] text-slate-400 print:text-slate-600">
            <p>Important Reminder: Never pay money to secure a job or internship. Always verify employers through their official website or your college placement cell.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
