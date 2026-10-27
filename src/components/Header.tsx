import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Home, 
  Search, 
  Clock, 
  Info,
  Menu,
  X,
  Sparkles,
  Lock,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type NavTab = 'home' | 'check' | 'history' | 'safety' | 'about';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  historyCount
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'check' as NavTab, label: 'Check a Job', icon: Search },
    { id: 'history' as NavTab, label: 'Past History', icon: Clock, count: historyCount },
    { id: 'safety' as NavTab, label: 'Threat Intel', icon: ShieldCheck },
    { id: 'about' as NavTab, label: 'System Info', icon: Info },
  ];

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#050816]/85 border-b border-cyan-500/15 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
      {/* Top Cyber Telemetry Bar */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-blue-950/40 px-4 py-1.5 text-[11px] text-cyan-300/80 border-b border-cyan-500/10 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-2 sm:px-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <span className="font-mono uppercase tracking-wider text-[10px] text-cyan-200">
              Cyber Threat Defense Active
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">
              Automated Verification Engine for Students &amp; Job Seekers
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Zero-Trust Guard
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline text-slate-400">100% Free Public Utility</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo with Glowing Shield */}
        <button
          onClick={() => handleSelectTab('home')}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          {/* Glowing Shield Icon */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 opacity-60 blur group-hover:opacity-100 transition duration-300 animate-pulse-glow" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#0c1229] to-[#060a17] border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.3)] group-hover:border-cyan-300 group-hover:text-cyan-200 transition-all">
              <ShieldCheck className="w-6 h-6 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight group-hover:text-cyan-100 transition-colors">
                Fake Job &amp; Internship Scam Checker
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-medium">
                AI SaaS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors font-sans">
              Cybersecurity Verification &amp; Threat Detection
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-cyan-500/20 backdrop-blur-md shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-cyan-500/20 via-blue-600/30 to-purple-600/20 border border-cyan-400/40 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive 
                      ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 shadow-[0_0_8px_rgba(56,189,248,0.4)]' 
                      : 'bg-slate-800 text-cyan-400 border border-slate-700'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-cyan-400 hover:text-white hover:border-cyan-400 transition-all shadow-[0_0_10px_rgba(56,189,248,0.15)]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-[#070b1a]/95 border-b border-cyan-500/20 px-4 pt-2 pb-4 space-y-1 backdrop-blur-2xl"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-400/40 text-cyan-300 font-semibold shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                      : 'text-slate-300 hover:bg-slate-850 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
