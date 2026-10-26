import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Building2, 
  Briefcase, 
  Mail, 
  Radio, 
  Lock, 
  Lightbulb,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { SAMPLE_CASES, SampleCase } from '../data/samples';
import { AnalysisResponse } from '../types';

interface AnalyzerProps {
  onAnalyze: (payload: {
    text: string;
    companyName?: string;
    jobTitle?: string;
    senderInfo?: string;
    channel?: string;
  }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onClear: () => void;
  currentResult: AnalysisResponse | null;
}

export const Analyzer: React.FC<AnalyzerProps> = ({
  onAnalyze,
  isLoading,
  error,
  onClear
}) => {
  const [text, setText] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [senderInfo, setSenderInfo] = useState('');
  const [channel, setChannel] = useState('Email');
  const [showExtraDetails, setShowExtraDetails] = useState(false);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);

  const handleSelectSample = (sample: SampleCase) => {
    setActiveSampleId(sample.id);
    setText(sample.text);
    setCompanyName(sample.companyName);
    setJobTitle(sample.jobTitle);
    setSenderInfo(sample.senderInfo);
    setChannel(sample.channel);
    setShowExtraDetails(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.trim().length < 20) return;
    onAnalyze({
      text: text.trim(),
      companyName: companyName.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      senderInfo: senderInfo.trim() || undefined,
      channel: channel || undefined
    });
  };

  const handleClear = () => {
    setText('');
    setCompanyName('');
    setJobTitle('');
    setSenderInfo('');
    setChannel('Email');
    setActiveSampleId(null);
    onClear();
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-xl">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Check a Job Advertisement
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
          Paste any job offer, email, internship notice, or recruitment message below to check for warning signs.
        </p>
      </div>

      {/* Preset Test Case Selector */}
      <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Try a Quick Example:
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Click any example to paste it automatically</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SAMPLE_CASES.map((sample) => {
            const isSelected = activeSampleId === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-950/60 border-blue-500 shadow-md ring-1 ring-blue-500'
                    : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div>
                  <span className="font-semibold text-xs text-slate-200 line-clamp-1">
                    {sample.name}
                  </span>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {sample.description}
                  </p>
                </div>
                <div className="mt-2 text-[10px] text-blue-400 flex items-center gap-1 font-medium">
                  <span>Use this example</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Check Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl p-5 sm:p-7 border border-slate-800 shadow-lg space-y-5">
        <div className="flex items-center justify-between">
          <label htmlFor="checkInput" className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
            Job Advertisement Text
          </label>

          <button
            type="button"
            onClick={() => setShowExtraDetails(!showExtraDetails)}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {showExtraDetails ? 'Hide Extra Details' : '+ Add Extra Details (Company, Email, etc.)'}
          </button>
        </div>

        {/* Collapsible Metadata Fields */}
        {showExtraDetails && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div>
              <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1 mb-1">
                <Building2 className="w-3 h-3 text-slate-400" /> Company Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Tech"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1 mb-1">
                <Briefcase className="w-3 h-3 text-slate-400" /> Job Role (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Intern, Assistant"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1 mb-1">
                <Mail className="w-3 h-3 text-slate-400" /> Recruiter's Email (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. hr@company.com"
                value={senderInfo}
                onChange={(e) => setSenderInfo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1 mb-1">
                <Radio className="w-3 h-3 text-slate-400" /> Where Was It Received?
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Email">Email</option>
                <option value="WhatsApp / Telegram">WhatsApp / Telegram</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="SMS / Text Message">SMS / Text Message</option>
                <option value="College Placement Office">College Placement Office</option>
                <option value="Job Website">Job Website</option>
              </select>
            </div>
          </div>
        )}

        {/* Text Area */}
        <div>
          <textarea
            id="checkInput"
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the job or internship advertisement here..."
            className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 rounded-xl p-4 text-xs sm:text-sm border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent leading-relaxed resize-y"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
            <span>{text.length} characters</span>
            {text.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Text</span>
              </button>
            )}
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Something Went Wrong</p>
              <p className="mt-0.5 text-rose-300/90">{error}</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Required Short Note */}
          <div className="flex items-center gap-2 text-xs text-amber-300/90 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Never pay money to secure a job without verifying the employer.</span>
          </div>

          <div className="flex items-center gap-2.5">
            {text.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Clear Text
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || text.trim().length < 20}
              className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                isLoading || text.trim().length < 20
                  ? 'bg-blue-600/40 text-blue-200 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/20 active:scale-[0.99]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Checking Your Advertisement...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Check This Job</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
