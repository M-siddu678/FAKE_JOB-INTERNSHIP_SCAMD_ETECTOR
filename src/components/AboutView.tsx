import React from 'react';
import { 
  Info, 
  ShieldCheck, 
  GraduationCap, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  Lock,
  ArrowRight
} from 'lucide-react';

interface AboutViewProps {
  onGoToChecker: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onGoToChecker }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
          <Info className="w-4 h-4 text-blue-400" />
          <span>About This Tool</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          About the Fake Job &amp; Internship Scam Checker
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          A free, accessible safety website created to help college students, fresh graduates, and job seekers check whether recruitment messages and internship offers are genuine or potential scams.
        </p>
      </div>

      {/* 5 Core Questions Answered in Plain English */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. What this website does */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">
            1. What This Website Does
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            This tool scans job advertisements, internship emails, and messages you receive on platforms like WhatsApp or Telegram. It reads through the text to spot common deception patterns, fee demands, and fraudulent claims that scammers typically use.
          </p>
        </div>

        {/* 2. Why students need it */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">
            2. Why Students Need It
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Students and fresh graduates are the primary targets of recruitment scams. Scammers pretend to be famous companies (like Google, TCS, or Infosys) and trick eager candidates into paying "refundable registration fees" or "laptop courier charges," resulting in stolen money and identity theft.
          </p>
        </div>

        {/* 3. How to use it */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">
            3. How to Use It
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            It takes just a few seconds:
          </p>
          <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 pl-1">
            <li>Copy the job offer or message you received.</li>
            <li>Paste it into our text box on the Home or Check a Job page.</li>
            <li>Click <strong>Check This Job</strong>.</li>
            <li>Review the warning signs found and follow the recommended safety steps.</li>
          </ol>
        </div>

        {/* 4. What warning signs it checks */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">
            4. What Warning Signs It Checks
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Our detection system looks for major danger signs, including:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 pl-1">
            <li>Demands for registration, training, or equipment fees.</li>
            <li>Unrealistically high salaries for low-skill tasks.</li>
            <li>Recruiters using personal Gmail or Yahoo addresses.</li>
            <li>Interviews done strictly over Telegram or WhatsApp chat.</li>
            <li>Urgent deadlines pushing you to pay right away.</li>
            <li>Requests for private banking passwords, PINs, or OTPs.</li>
          </ul>
        </div>
      </div>

      {/* 5. Why users should independently verify employers */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-7 border border-blue-900/60 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-bold text-white">
            5. Why You Should Always Independently Verify Employers
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          While this checker is very helpful at catching common scam phrases and red flags, no automated website can replace your own judgment. Scammers constantly change their words and tactics.
        </p>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
          <p className="font-semibold text-white">Always follow these two simple habits:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
            <li>Visit the company's real website yourself by typing their name into Google or your browser address bar.</li>
            <li>If you are in college, ask your Training &amp; Placement Officer (TPO) to confirm if the recruiter is legitimate.</li>
          </ul>
        </div>
      </div>

      {/* Call to action */}
      <div className="text-center pt-2 pb-4">
        <button
          onClick={onGoToChecker}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-all active:scale-[0.99]"
        >
          <span>Check a Job Advertisement Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
