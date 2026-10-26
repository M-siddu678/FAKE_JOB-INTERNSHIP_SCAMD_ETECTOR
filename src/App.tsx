import React, { useState, useEffect } from 'react';
import { Header, NavTab } from './components/Header';
import { HomeView } from './components/HomeView';
import { Analyzer } from './components/Analyzer';
import { AnalysisResultView } from './components/AnalysisResultView';
import { HistoryView } from './components/HistoryView';
import { SafetyTipsView } from './components/SafetyTipsView';
import { AboutView } from './components/AboutView';
import { ReportModal } from './components/ReportModal';
import { 
  AnalysisResponse, 
  AnalysisRecordItem, 
  DatabaseStats 
} from './types';
import { ShieldCheck, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [currentResult, setCurrentResult] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Saved records state
  const [records, setRecords] = useState<AnalysisRecordItem[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);

  const fetchRecords = async () => {
    try {
      const [historyRes, statsRes] = await Promise.all([
        fetch('/api/history'),
        fetch('/api/stats')
      ]);

      if (historyRes.ok) {
        const hData = await historyRes.json();
        setRecords(hData.records || []);
      }

      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData);
      }
    } catch (err) {
      console.error('Could not load saved records:', err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Handle scam analysis submission
  const handleAnalyze = async (payload: {
    text: string;
    companyName?: string;
    jobTitle?: string;
    senderInfo?: string;
    channel?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sorry, we could not check this advertisement. Please try again.');
      }

      setCurrentResult(data);
      // Switch to Check a Job tab to display the results
      setActiveTab('check');
      fetchRecords();
    } catch (err: any) {
      console.error('Check error:', err);
      setError(err.message || 'Sorry, we could not check this advertisement right now. Please try again in a few moments.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete saved record
  const handleDeleteRecord = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        fetchRecords();
      }
    } catch (err) {
      console.error('Failed to delete record:', err);
    }
  };

  // Toggle bookmark on record
  const handleToggleStar = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}/star`, { method: 'PATCH' });
      if (res.ok) {
        setRecords((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, is_starred: r.is_starred ? 0 : 1 } : r
          )
        );
      }
    } catch (err) {
      console.error('Failed to update bookmark:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setError(null);
        }}
        historyCount={records.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 1. HOME TAB */}
        {activeTab === 'home' && (
          <HomeView
            onCheckJob={handleAnalyze}
            isLoading={isLoading}
            error={error}
            onNavigateToSafety={() => setActiveTab('safety')}
            onNavigateToAbout={() => setActiveTab('about')}
          />
        )}

        {/* 2. CHECK A JOB TAB */}
        {activeTab === 'check' && (
          <div className="space-y-8">
            {currentResult ? (
              <AnalysisResultView
                result={currentResult}
                onOpenReport={() => setShowReportModal(true)}
                onReset={() => {
                  setCurrentResult(null);
                  setError(null);
                }}
                onToggleStar={handleToggleStar}
                isStarred={records.find((r) => r.id === currentResult.recordId)?.is_starred === 1}
              />
            ) : (
              <Analyzer
                onAnalyze={handleAnalyze}
                isLoading={isLoading}
                error={error}
                onClear={() => {
                  setCurrentResult(null);
                  setError(null);
                }}
                currentResult={null}
              />
            )}
          </div>
        )}

        {/* 3. PAST HISTORY TAB */}
        {activeTab === 'history' && (
          <HistoryView
            records={records}
            stats={stats}
            onRefresh={fetchRecords}
            onDelete={handleDeleteRecord}
            onToggleStar={handleToggleStar}
          />
        )}

        {/* 4. SAFETY TIPS TAB */}
        {activeTab === 'safety' && <SafetyTipsView />}

        {/* 5. ABOUT US TAB */}
        {activeTab === 'about' && (
          <AboutView
            onGoToChecker={() => {
              setCurrentResult(null);
              setActiveTab('check');
            }}
          />
        )}
      </main>

      {/* Printable Report Modal */}
      {showReportModal && currentResult && (
        <ReportModal
          result={currentResult}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Simple, Friendly Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-slate-300">
              Fake Job &amp; Internship Scam Checker
            </span>
            <span className="text-slate-600">•</span>
            <span>Free Student Safety Tool</span>
          </div>

          <div className="text-[11px] text-slate-500">
            Never pay money to secure a job or internship without verifying the employer.
          </div>
        </div>
      </footer>
    </div>
  );
}
