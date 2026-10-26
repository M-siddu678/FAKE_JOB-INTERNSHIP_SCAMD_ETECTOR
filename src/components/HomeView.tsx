import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight, 
  HelpCircle,
  Lightbulb,
  Lock,
  DollarSign,
  Mail,
  Clock
} from 'lucide-react';
import { SAMPLE_CASES, SampleCase } from '../data/samples';

interface HomeViewProps {
  onCheckJob: (payload: {
    text: string;
    companyName?: string;
    jobTitle?: string;
    senderInfo?: string;
    channel?: string;
  }) => void;
  isLoading: boolean;
  error: string | null;
  onNavigateToSafety: () => void;
  onNavigateToAbout: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onCheckJob,
  isLoading,
  error,
  onNavigateToSafety,
  onNavigateToAbout
}) => {
  const [text, setText] = useState('');
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.trim().length < 20) return;
    onCheckJob({ text: text.trim() });
  };

  const handleClear = () => {
    setText('');
    setSelectedSampleId(null);
  };

  const handlePickSample = (sample: SampleCase) => {
    setSelectedSampleId(sample.id);
    setText(sample.text);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-200">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-2 sm:pt-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Free Scam Protection for Students &amp; Freshers</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Fake Job &amp; Internship Scam Checker
        </h2>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Check job offers and internship advertisements for warning signs before sharing personal information or paying money.
        </p>
      </div>

      {/* Main Check Box Card */}
      <div className="bg-slate-900 rounded-2xl p-5 sm:p-8 border border-slate-800 shadow-xl max-w-4xl mx-auto space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="adText" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Paste Your Job Offer or Message Below:
            </label>
            <textarea
              id="adText"
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the job or internship advertisement here..."
              className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 rounded-xl p-4 text-xs sm:text-sm border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent leading-relaxed resize-y"
            />
          </div>

          {/* Validation or Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Buttons & Short Note */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            {/* Required Short Note */}
            <div className="flex items-center gap-2 text-xs text-amber-300/90 font-medium bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
              <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Never pay money to secure a job without verifying the employer.</span>
            </div>

            <div className="flex items-center gap-2.5">
              {text.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Text</span>
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

        {/* Quick Sample Selector */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2 mb-2.5">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Or Try an Example Advertisement:
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SAMPLE_CASES.slice(0, 3).map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handlePickSample(sample)}
                className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                  selectedSampleId === sample.id
                    ? 'bg-blue-950/60 border-blue-500 text-blue-200 ring-1 ring-blue-500'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="font-semibold truncate">{sample.name}</div>
                <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {sample.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Step Guidance Cards */}
      <div className="max-w-4xl mx-auto space-y-4">
        <h3 className="text-base font-bold text-white text-center">
          How to Protect Yourself in 3 Simple Steps
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h4 className="text-sm font-bold text-slate-100">Paste the Message</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Copy the text from your email, WhatsApp, Telegram, or job board and paste it into the box above.
            </p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h4 className="text-sm font-bold text-slate-100">Look at the Warning Signs</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              We look for fee demands, unrealistic salaries, rushed deadlines, and free email addresses.
            </p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h4 className="text-sm font-bold text-slate-100">Follow the Safety Steps</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Get plain-English advice on what to do, how to double-check with the real company, and who to contact.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="max-w-4xl mx-auto bg-slate-900/60 rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">Want to learn how to spot scammers on your own?</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Read our quick guide on recognizing fake recruiters and protecting your bank account.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToSafety}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Read Safety Tips</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onNavigateToAbout}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            <span>About This Tool</span>
          </button>
        </div>
      </div>
    </div>
  );
};
