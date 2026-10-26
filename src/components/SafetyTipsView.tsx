import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  PhoneCall, 
  ExternalLink, 
  CheckCircle2, 
  Lock, 
  Mail, 
  DollarSign, 
  Building, 
  HelpCircle,
  KeyRound
} from 'lucide-react';

export const SafetyTipsView: React.FC = () => {
  const coreTips = [
    {
      title: '1. Never pay a registration fee without verification',
      icon: DollarSign,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      description: 'Legitimate employers pay you for your work; you should never have to pay to get hired. Any request for a "registration charge", "refundable deposit", "training kit fee", or "laptop courier fee" is almost always a scam.'
    },
    {
      title: '2. Check the company\'s official website',
      icon: Building,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      description: 'Do not just click the links provided in an email or message. Open your web browser, type the official company name, and check their real "Careers" or "Jobs" page to see if the opening actually exists.'
    },
    {
      title: '3. Verify the recruiter\'s email address',
      icon: Mail,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      description: 'Professional recruiters email you from their company domain (e.g., name@company.com). Be extremely cautious if someone claiming to work for a major enterprise emails you from @gmail.com, @yahoo.com, or @hotmail.com.'
    },
    {
      title: '4. Be careful with unrealistic salary promises',
      icon: AlertTriangle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      description: 'Offers promising ₹40,000 to ₹70,000 per month for just 1–2 hours of simple work (like watching YouTube videos, liking posts, or typing data) are standard traps to steal your money.'
    },
    {
      title: '5. Never share passwords or OTPs',
      icon: KeyRound,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      description: 'No legitimate employer will ever ask for your online banking password, ATM PIN, credit card security code (CVV), or One-Time Password (OTP). Keep this information strictly private.'
    },
    {
      title: '6. Confirm the job through official recruitment channels',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      description: 'If you are a college student, check with your college Training & Placement Officer (TPO) before accepting an internship offer. You can also contact the company\'s main reception switchboard to verify the recruiter.'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <span>Safety Tips for Students &amp; Job Seekers</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
          Follow these golden safety rules whenever you receive an unsolicited job offer, internship message, or work-from-home invitation.
        </p>
      </div>

      {/* 6 Core Advice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coreTips.map((tip, idx) => {
          const Icon = tip.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${tip.bgColor} ${tip.borderColor} border flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${tip.color}`} />
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">
                  {tip.title}
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-1">
                {tip.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Checklist */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-blue-400" />
          <span>Quick 5-Point Safety Checklist</span>
        </h3>
        <p className="text-xs text-slate-400">
          Before you sign any letter or send any personal documents, ask yourself these 5 questions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200 block">1. Did they interview you?</span>
            <p className="text-slate-400 text-[11px]">Real companies don't hire you instantly without at least one interview.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200 block">2. Are they asking for money?</span>
            <p className="text-slate-400 text-[11px]">If they ask for any advance payment, stop immediately.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200 block">3. Is the email address real?</span>
            <p className="text-slate-400 text-[11px]">Check if the domain matches the official company website.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200 block">4. Are they rushing you?</span>
            <p className="text-slate-400 text-[11px]">Scammers push you to act within 2 hours so you don't ask for advice.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200 block">5. Did you ask your college TPO?</span>
            <p className="text-slate-400 text-[11px]">Your college placement office can help you verify the employer.</p>
          </div>
        </div>
      </div>

      {/* Emergency Help & Reporting */}
      <div className="bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-900 rounded-2xl p-6 border border-rose-900/50 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-5 h-5 text-rose-400" />
          <h3 className="text-base font-bold text-white">
            Need Help or Need to Report a Scam?
          </h3>
        </div>
        <p className="text-xs text-slate-300">
          If you were tricked into paying money or sending personal documents, take action immediately:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
              National Cyber Crime Helpline (India)
            </span>
            <p className="text-lg font-extrabold text-white">Dial 1930 (Toll-Free)</p>
            <p className="text-slate-400 text-[11px]">
              Call immediately so authorities can help freeze fraudulent bank or UPI transactions.
            </p>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-semibold mt-1"
            >
              <span>Visit cybercrime.gov.in</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
              College &amp; Campus Steps
            </span>
            <p className="text-base font-bold text-white">Notify Your Placement Office</p>
            <p className="text-slate-400 text-[11px]">
              Inform your college Training &amp; Placement Officer (TPO) so they can warn your peers and blacklist the sender.
            </p>
            <span className="text-[11px] text-emerald-400 font-medium block mt-1">
              Warn your friends and classmates
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
