import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Eye, 
  Calendar, 
  Building2, 
  Clock, 
  X,
  FileSpreadsheet,
  FileJson,
  Bookmark
} from 'lucide-react';
import { AnalysisRecordItem, DatabaseStats } from '../types';

interface HistoryViewProps {
  records: AnalysisRecordItem[];
  stats: DatabaseStats | null;
  onRefresh: () => void;
  onDelete: (id: string) => Promise<void>;
  onToggleStar: (id: string) => Promise<void>;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  onRefresh,
  onDelete,
  onToggleStar
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'Genuine' | 'Suspicious' | 'Fraudulent'>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecordItem | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const filteredRecords = records.filter((r) => {
    const matchesCategory = selectedCategory === 'ALL' || r.risk_category === selectedCategory;
    const matchesSearch =
      !searchTerm.trim() ||
      r.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.sender_info?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.raw_text?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this saved record?')) {
      setIsDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setIsDeletingId(null);
      }
    }
  };

  const getFriendlyRisk = (cat: 'Genuine' | 'Suspicious' | 'Fraudulent') => {
    switch (cat) {
      case 'Fraudulent':
        return {
          label: 'High Risk',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        };
      case 'Suspicious':
        return {
          label: 'Needs Careful Checking',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        };
      case 'Genuine':
        return {
          label: 'Low Risk',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Your Previous Checks
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review the job offers and internship messages you have checked previously.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/export?format=csv"
            download="job_checks_summary.csv"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </a>

          <a
            href="/api/export?format=json"
            download="job_checks_summary.json"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Download JSON</span>
          </a>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search your previous checks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['ALL', 'Fraudulent', 'Suspicious', 'Genuine'] as const).map((cat) => {
            const label = cat === 'ALL' ? 'All' : cat === 'Fraudulent' ? 'High Risk' : cat === 'Suspicious' ? 'Needs Checking' : 'Low Risk';
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Records List */}
      {records.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl p-12 border border-slate-800 text-center space-y-3">
          <Clock className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">
            You haven't checked any job advertisements yet.
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you check a job advertisement on the Home or Check a Job page, it will be automatically saved here for you to review later.
          </p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl p-10 border border-slate-800 text-center space-y-2">
          <p className="text-sm text-slate-300">No previous checks match your search.</p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedCategory('ALL'); }}
            className="text-xs text-blue-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredRecords.map((r) => {
            const riskInfo = getFriendlyRisk(r.risk_category);
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRecord(r)}
                className="bg-slate-900 hover:bg-slate-850 rounded-xl p-4 sm:p-5 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${riskInfo.badge}`}>
                      {riskInfo.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      Score: <strong className={r.risk_score >= 70 ? 'text-rose-400' : r.risk_score >= 35 ? 'text-amber-400' : 'text-emerald-400'}>{r.risk_score}/100</strong>
                    </span>
                    <span className="text-slate-600 text-xs hidden sm:inline">•</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {new Date(r.timestamp).toLocaleDateString()} at {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                    {r.job_title || 'Job Advertisement'}
                  </h4>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {r.company_name || 'Unspecified Company'}
                    </span>
                    <span>•</span>
                    <span>Received via: {r.channel}</span>
                    {r.flags.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-rose-300 font-medium">
                          {r.flags.length} Warning Sign(s)
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-1 italic">
                    "{r.summary}"
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStar(r.id);
                    }}
                    className={`p-2 rounded-lg border transition-all ${
                      r.is_starred
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                    title={r.is_starred ? 'Bookmarked' : 'Bookmark this check'}
                  >
                    <Bookmark className={`w-4 h-4 ${r.is_starred ? 'fill-amber-400' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRecord(r);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Result</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(r.id, e)}
                    disabled={isDeletingId === r.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 text-xs font-semibold transition-all"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Delete Record</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Result Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getFriendlyRisk(selectedRecord.risk_category).badge}`}>
                    {getFriendlyRisk(selectedRecord.risk_category).label}
                  </span>
                  <span className="text-xs text-slate-400">
                    Estimated Risk Score: {selectedRecord.risk_score}/100
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedRecord.job_title}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedRecord.company_name} • Checked on {new Date(selectedRecord.timestamp).toLocaleString()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Result Summary:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedRecord.summary}
              </p>
            </div>

            {/* Warning signs */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Warning Signs Found ({selectedRecord.flags.length})
              </h4>
              {selectedRecord.flags.length === 0 ? (
                <p className="text-xs text-emerald-400">No warning signs found.</p>
              ) : (
                <div className="space-y-2">
                  {selectedRecord.flags.map((f, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{f.label}</span>
                      </div>
                      <p className="text-slate-400">{f.description}</p>
                      {f.evidenceSnippet && (
                        <p className="text-amber-300 text-[11px] italic bg-slate-900 p-1.5 rounded">
                          "{f.evidenceSnippet}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Job advertisement */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Job Advertisement Text
              </h4>
              <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {selectedRecord.raw_text}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
